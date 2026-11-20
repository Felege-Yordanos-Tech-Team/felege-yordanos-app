'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import {
  db,
  eventReminders,
  messageBroadcasts,
} from '@felege-yordanos/db/server';
import { fail, NOT_ALLOWED, ok, type ActionResult } from '@/lib/action-result';
import {
  canCancelBroadcast,
  canEditBroadcast,
  canSendMessages,
} from '@/lib/permissions';
import { hitRateLimit } from '@/lib/rate-limit';
import { requireUser, type CurrentUser } from '@/lib/session';
import {
  MESSAGE_AUDIENCES,
  summarize,
  type SelectionSummary,
} from '@/lib/sms/message-audience';
import {
  insertBroadcast,
  insertScheduledBroadcast,
  loadSelection,
  loadTargetCandidates,
  ownPhone,
  replaceTargets,
  searchPeople,
} from '@/lib/sms/message-queries';
import { eatMoment, sendLaterRefusal } from '@/lib/sms/schedule';
import {
  checkTargets,
  confirmNames,
  personOption,
  searchText,
  TARGET_ERRORS,
  type PersonOption,
  type TargetRef,
} from '@/lib/sms/selected-people';
import { getT } from '@/lib/i18n/server';
import { composeSms, estimateCredits, MAX_PARTS, MAX_SMS_INPUT } from '@/lib/sms/split';
import { smsSignature, smsTransport } from '@/lib/sms/transport';

const MAX_TEXT = MAX_SMS_INPUT;

const targetSchema = z.object({
  kind: z.enum(['member', 'pre_member']),
  id: z.number().int().positive(),
});

const audienceSchema = z
  .object({
    audience: z.enum(MESSAGE_AUDIENCES),
    eventId: z.guid('Choose an event.').nullable(),
    // Audience 'selected': the chosen people (checked by resolveTargets;
    // the limit of 200 counts each person once).
    targets: z.array(targetSchema).max(1000, TARGET_ERRORS.tooMany).default([]),
  })
  .refine((v) => v.audience !== 'event' || v.eventId !== null, {
    message: 'Choose an event.',
  });

const messageSchema = z.intersection(
  audienceSchema,
  z.object({
    channel: z.enum(['sms', 'telegram']).default('sms'),
    text: z
      .string()
      .max(MAX_TEXT, `The message must be at most ${MAX_TEXT} characters.`),
    // "Send later": date and time in Ethiopian time (Africa/Addis_Ababa).
    // null = now.
    sendAt: z
      .object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date and time.'),
        time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Choose a date and time.'),
      })
      .nullable()
      .default(null),
  }),
);

export type MessageInput = z.input<typeof messageSchema>;

const firstIssue = (e: z.ZodError) => e.issues[0]?.message ?? 'Invalid input.';

/** The "send later" moment, or null for now; error when it is refused. */
function scheduledMoment(
  sendAt: { date: string; time: string } | null,
): { at: Date | null } | { error: string } {
  if (!sendAt) return { at: null };
  const at = eatMoment(sendAt.date, sendAt.time);
  const refusal = sendLaterRefusal(at, new Date());
  return refusal ? { error: refusal } : { at };
}

/**
 * The one message for a text (sent to the provider as is; it appends the
 * signature) and its SMS parts, or why it is refused (translated: it
 * carries the number of characters to remove).
 */
async function smsFor(
  text: string,
): Promise<{ text: string; smsParts: number } | { error: string }> {
  const sms = composeSms(text, smsSignature());
  if (sms.ok) return { text: sms.text, smsParts: sms.smsParts };
  if (sms.reason === 'empty') return { error: 'Enter a message.' };
  const t = await getT();
  return {
    error: t(
      sms.excess === 1
        ? 'Too long: at most {max} SMS parts. Remove 1 character, or post it on the notice board.'
        : 'Too long: at most {max} SMS parts. Remove {n} characters, or post it on the notice board.',
      { n: sms.excess, max: MAX_PARTS },
    ),
  };
}

/**
 * Audience 'selected': the chosen people, checked against their records now
 * (exist, active, can get SMS, at most 200). Anyone who cannot is refused,
 * never silently skipped. Other audiences: none.
 */
async function resolveTargets(input: {
  audience: (typeof MESSAGE_AUDIENCES)[number];
  targets: TargetRef[];
}): Promise<{ targets: TargetRef[] } | { error: string }> {
  if (input.audience !== 'selected') return { targets: [] };
  if (!input.targets.length) return { error: TARGET_ERRORS.none };
  const checked = checkTargets(
    input.targets,
    await loadTargetCandidates(input.targets.slice(0, 1000)),
  );
  return checked.ok ? { targets: checked.targets } : { error: checked.error };
}

async function requireSender(): Promise<CurrentUser | null> {
  const user = await requireUser();
  return canSendMessages(user) ? user : null;
}

export interface AudiencePreview {
  summary: SelectionSummary;
  /** Credits left, or null when it cannot be read (console transport). */
  balance: number | null;
}

/**
 * Recipient counts (no names, no numbers) and the SMS balance, for the
 * compose page and the event reminder. Permission: canSendMessages.
 */
export async function previewAudience(input: {
  audience: (typeof MESSAGE_AUDIENCES)[number];
  eventId: string | null;
  targets?: TargetRef[];
}): Promise<ActionResult<AudiencePreview>> {
  const user = await requireSender();
  if (!user) return fail(NOT_ALLOWED);
  const parsed = audienceSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const chosen = await resolveTargets(parsed.data);
  if ('error' in chosen) return fail(chosen.error);
  const loaded = await loadSelection(
    parsed.data.audience,
    parsed.data.eventId,
    chosen.targets,
  );
  if (!loaded) return fail('Event not found.');
  const transport = smsTransport();
  return ok({
    summary: summarize(loaded.selection),
    balance: transport.hasBalance ? await transport.balance() : null,
  });
}

export interface PreparedBroadcast {
  /** ISO instant for "send later", null = now. */
  scheduledAt: string | null;
  /** The one message (without the signature, which the provider appends). */
  text: string;
  /** SMS parts per person (the message is charged per part). */
  smsParts: number;
  signature: string;
  summary: SelectionSummary;
  credits: number;
  balance: number | null;
  /** Audience 'selected': the first names and how many more. */
  people: { names: string[]; more: number } | null;
}

/**
 * Everything the confirm step repeats, after the provider checked the
 * message (so a text it would reject never starts a broadcast). Nothing is
 * sent. Permission: canSendMessages.
 */
export async function prepareBroadcast(
  input: MessageInput,
): Promise<ActionResult<PreparedBroadcast>> {
  const user = await requireSender();
  if (!user) return fail(NOT_ALLOWED);
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  if (parsed.data.channel !== 'sms') return fail('Telegram is coming soon.');
  if (!(await hitRateLimit(db, `sms:prepare:${user.id}`, 3600, 30)))
    return fail('Too many checks. Please wait a while and try again.');

  const sms = await smsFor(parsed.data.text);
  if ('error' in sms) return fail(sms.error);
  const when = scheduledMoment(parsed.data.sendAt);
  if ('error' in when) return fail(when.error);
  const transport = smsTransport();
  if (!transport.configured) return fail('SMS is not configured.');

  const chosen = await resolveTargets(parsed.data);
  if ('error' in chosen) return fail(chosen.error);
  const loaded = await loadSelection(
    parsed.data.audience,
    parsed.data.eventId,
    chosen.targets,
  );
  if (!loaded) return fail('Event not found.');
  const summary = summarize(loaded.selection);
  // Later: people are counted again when it goes out.
  if (summary.recipients === 0 && !when.at)
    return fail('Nobody in this audience has a phone number for SMS.');

  // The provider's own check of the message (nothing sent or charged).
  const checkPhone =
    (await ownPhone(user)) ?? loaded.selection.recipients[0]?.phone ?? null;
  if (checkPhone) {
    const res = await transport.check(checkPhone, sms.text);
    if (!res.ok) return fail(`SMSHub: ${res.message}`);
  }

  return ok({
    scheduledAt: when.at?.toISOString() ?? null,
    text: sms.text,
    smsParts: sms.smsParts,
    signature: smsSignature(),
    summary,
    credits: estimateCredits(sms.smsParts, summary),
    balance: transport.hasBalance ? await transport.balance() : null,
    people:
      parsed.data.audience === 'selected'
        ? confirmNames(loaded.selection.recipients)
        : null,
  });
}

/**
 * Creates the broadcast. Now: recipients and messages are frozen now, the
 * worker sends them in the background; refused when the balance is lower
 * than the estimate (real sends only). Later (`sendAt`): stored as
 * 'scheduled' without recipients; the worker works them out and checks the
 * balance when it goes out. Permission: canSendMessages; 5 per hour
 * (scheduling counts).
 */
export async function createBroadcast(
  input: MessageInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireSender();
  if (!user) return fail(NOT_ALLOWED);
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  if (parsed.data.channel !== 'sms') return fail('Telegram is coming soon.');

  const sms = await smsFor(parsed.data.text);
  if ('error' in sms) return fail(sms.error);
  const when = scheduledMoment(parsed.data.sendAt);
  if ('error' in when) return fail(when.error);
  const transport = smsTransport();
  if (!transport.configured) return fail('SMS is not configured.');

  const chosen = await resolveTargets(parsed.data);
  if ('error' in chosen) return fail(chosen.error);
  const loaded = await loadSelection(
    parsed.data.audience,
    parsed.data.eventId,
    chosen.targets,
  );
  if (!loaded) return fail('Event not found.');

  if (when.at) {
    const scheduledAt = when.at;
    if (!(await hitRateLimit(db, `sms:broadcast:${user.id}`, 3600, 5)))
      return fail('At most 5 messages per hour. Please wait a while.');
    const id = await db.transaction((tx) =>
      insertScheduledBroadcast(tx, {
        text: sms.text,
        parts: [sms.text],
        smsParts: sms.smsParts,
        audience: parsed.data.audience,
        eventId: parsed.data.audience === 'event' ? parsed.data.eventId : null,
        createdBy: user.id,
        scheduledAt,
        targets: chosen.targets,
      }),
    );
    revalidatePath('/admin/messages');
    return ok({ id });
  }

  const summary = summarize(loaded.selection);
  if (summary.recipients === 0) return fail('Nobody in this audience has a phone number for SMS.');

  if (transport.charges) {
    const balance = await transport.balance();
    const credits = estimateCredits(sms.smsParts, summary);
    if (balance === null) return fail('Could not read the SMS balance. Try again.');
    if (balance < credits)
      return fail(
        `Not enough SMS credits: ${balance} left, about ${credits} needed.`,
      );
  }
  if (!(await hitRateLimit(db, `sms:broadcast:${user.id}`, 3600, 5)))
    return fail('At most 5 messages per hour. Please wait a while.');

  const id = await db.transaction((tx) =>
    insertBroadcast(tx, {
      text: sms.text,
      parts: [sms.text],
      smsParts: sms.smsParts,
      audience: parsed.data.audience,
      eventId: parsed.data.audience === 'event' ? parsed.data.eventId : null,
      origin: 'manual',
      createdBy: user.id,
      selection: loaded.selection,
      targets: chosen.targets,
    }),
  );
  revalidatePath('/admin/messages');
  return ok({ id });
}

/**
 * Sends the message to the sender's own phone (linked member or pre-member
 * record). Permission: canSendMessages; 5 per hour.
 */
export async function sendTestToSelf(input: {
  text: string;
}): Promise<ActionResult<{ sent: number }>> {
  const user = await requireSender();
  if (!user) return fail(NOT_ALLOWED);
  const text = z.string().max(MAX_TEXT).safeParse(input.text);
  if (!text.success) return fail('Invalid input.');
  const sms = await smsFor(text.data);
  if ('error' in sms) return fail(sms.error);
  const transport = smsTransport();
  if (!transport.configured) return fail('SMS is not configured.');
  const phone = await ownPhone(user);
  if (!phone) return fail('Your profile has no phone number for SMS.');
  if (!(await hitRateLimit(db, `sms:test:${user.id}`, 3600, 5)))
    return fail('At most 5 test messages per hour. Please wait a while.');

  const res = await transport.send(phone, sms.text);
  if (!res.ok) return fail(`SMSHub: ${res.message}`);
  return ok({ sent: 1 });
}

const searchSchema = z.object({
  q: z.string().max(200),
  kind: z.enum(['member', 'pre_member']).nullable().default(null),
  memberTypeId: z.number().int().positive().nullable().default(null),
});

/**
 * Search for the "Selected people" picker: active members and pre-members
 * by name, father's name or ID, at most 20, with a masked number and why
 * someone cannot be chosen. A POST (server action), so the search text is
 * never in a URL. Permission: canSendMessages; 60 per minute.
 */
export async function searchPeopleForSms(
  input: z.input<typeof searchSchema>,
): Promise<ActionResult<PersonOption[]>> {
  const user = await requireSender();
  if (!user) return fail(NOT_ALLOWED);
  const parsed = searchSchema.safeParse(input);
  if (!parsed.success) return fail('Invalid input.');
  const text = searchText(parsed.data.q);
  if (!text) return fail('Type at least 2 letters.');
  if (!(await hitRateLimit(db, `sms:search:${user.id}`, 60, 60)))
    return fail('Too many searches. Please wait a minute.');
  const people = await searchPeople({
    text,
    kind: parsed.data.kind,
    memberTypeId: parsed.data.memberTypeId,
  });
  return ok(people.map(personOption));
}

const idSchema = z.guid('Message not found.');

/**
 * Changes a scheduled broadcast (text, audience, chosen people, time) before
 * it goes out.
 * Same checks as scheduling it. Permission: canSendMessages and
 * canEditBroadcast (super admins, or the sender); status 'scheduled' only.
 */
export async function updateScheduledBroadcast(
  id: string,
  input: MessageInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireSender();
  if (!user) return fail(NOT_ALLOWED);
  const idParsed = idSchema.safeParse(id);
  if (!idParsed.success) return fail(NOT_ALLOWED);
  const [b] = await db
    .select({
      id: messageBroadcasts.id,
      status: messageBroadcasts.status,
      createdBy: messageBroadcasts.createdBy,
    })
    .from(messageBroadcasts)
    .where(eq(messageBroadcasts.id, idParsed.data))
    .limit(1);
  if (!b || !canEditBroadcast(user, b)) return fail(NOT_ALLOWED);
  if (b.status !== 'scheduled') return fail('This message has already started.');

  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  if (parsed.data.channel !== 'sms') return fail('Telegram is coming soon.');
  if (!parsed.data.sendAt) return fail('Choose a date and time.');
  const sms = await smsFor(parsed.data.text);
  if ('error' in sms) return fail(sms.error);
  const when = scheduledMoment(parsed.data.sendAt);
  if ('error' in when) return fail(when.error);
  if (!when.at) return fail('Choose a date and time.');
  const scheduledAt = when.at;
  const chosen = await resolveTargets(parsed.data);
  if ('error' in chosen) return fail(chosen.error);
  if (parsed.data.audience === 'event' && !(await loadSelection('event', parsed.data.eventId)))
    return fail('Event not found.');

  // The worker locks the row when it fires: then the status is no longer
  // 'scheduled' and nothing changes. The chosen people change in the same
  // transaction, after the row is locked by the update.
  const done = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(messageBroadcasts)
      .set({
        text: sms.text,
        // Always one message, also for one scheduled before #150 with
        // several numbered parts.
        parts: [sms.text],
        smsParts: sms.smsParts,
        audience: parsed.data.audience,
        eventId: parsed.data.audience === 'event' ? parsed.data.eventId : null,
        scheduledAt,
      })
      .where(
        and(eq(messageBroadcasts.id, b.id), eq(messageBroadcasts.status, 'scheduled')),
      )
      .returning({ id: messageBroadcasts.id });
    if (row) await replaceTargets(tx, b.id, chosen.targets);
    return !!row;
  });
  if (!done) return fail('This message has already started.');
  revalidatePath('/admin/messages');
  revalidatePath(`/admin/messages/${b.id}`);
  return ok({ id: b.id });
}

async function loadForChange(id: string, user: CurrentUser) {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return null;
  const [b] = await db
    .select({
      id: messageBroadcasts.id,
      status: messageBroadcasts.status,
      createdBy: messageBroadcasts.createdBy,
    })
    .from(messageBroadcasts)
    .where(eq(messageBroadcasts.id, parsed.data))
    .limit(1);
  if (!b || !canCancelBroadcast(user, b)) return null;
  return b;
}

/**
 * Stops a broadcast (or a scheduled one before it goes out): messages not
 * sent yet are not sent. Permission:
 * canCancelBroadcast (super admins, or the sender).
 */
export async function cancelBroadcast(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const b = await loadForChange(id, user);
  if (!b) return fail(NOT_ALLOWED);
  const [done] = await db
    .update(messageBroadcasts)
    .set({ status: 'cancelled', finishedAt: new Date() })
    .where(
      and(
        eq(messageBroadcasts.id, b.id),
        inArray(messageBroadcasts.status, ['scheduled', 'queued', 'sending', 'paused']),
      ),
    )
    .returning({ id: messageBroadcasts.id });
  if (!done) return fail('This message has already finished.');
  revalidatePath('/admin/messages');
  revalidatePath(`/admin/messages/${b.id}`);
  return ok();
}

/**
 * Resumes a paused broadcast: the worker checks the messages (and the
 * balance) again, then goes on where it stopped. Same permission as cancel.
 */
export async function resumeBroadcast(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const b = await loadForChange(id, user);
  if (!b) return fail(NOT_ALLOWED);
  if (!smsTransport().configured) return fail('SMS is not configured.');
  const [done] = await db
    .update(messageBroadcasts)
    .set({ status: 'queued', pauseReason: null })
    .where(
      and(eq(messageBroadcasts.id, b.id), eq(messageBroadcasts.status, 'paused')),
    )
    .returning({ id: messageBroadcasts.id });
  if (!done) return fail('This message is not paused.');
  await db
    .update(eventReminders)
    .set({ status: 'sent' })
    .where(
      and(eq(eventReminders.broadcastId, b.id), eq(eventReminders.status, 'paused')),
    );
  revalidatePath('/admin/messages');
  revalidatePath(`/admin/messages/${b.id}`);
  return ok();
}
