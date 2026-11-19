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
  ownPhone,
} from '@/lib/sms/message-queries';
import { eatMoment, sendLaterRefusal } from '@/lib/sms/schedule';
import { estimateCredits, MAX_PARTS, splitSms } from '@/lib/sms/split';
import { smsSignature, smsTransport } from '@/lib/sms/transport';

const MAX_TEXT = 1000;

const audienceSchema = z
  .object({
    audience: z.enum(MESSAGE_AUDIENCES),
    eventId: z.guid('Choose an event.').nullable(),
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

/** Message for a text the splitter refuses. */
function splitRefusal(text: string): { parts: string[] } | { error: string } {
  const split = splitSms(text, smsSignature());
  if (split.ok) return { parts: split.parts };
  if (split.reason === 'empty') return { error: 'Enter a message.' };
  if (split.reason === 'word_too_long')
    return { error: 'A word is too long for one SMS.' };
  return {
    error: `This message needs ${split.needed} SMS; at most ${MAX_PARTS} are allowed. Shorten it, or post it on the notice board.`,
  };
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
}): Promise<ActionResult<AudiencePreview>> {
  const user = await requireSender();
  if (!user) return fail(NOT_ALLOWED);
  const parsed = audienceSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const loaded = await loadSelection(parsed.data.audience, parsed.data.eventId);
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
  parts: string[];
  signature: string;
  summary: SelectionSummary;
  credits: number;
  balance: number | null;
}

/**
 * Everything the confirm step repeats, after the provider checked every
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

  const split = splitRefusal(parsed.data.text);
  if ('error' in split) return fail(split.error);
  const when = scheduledMoment(parsed.data.sendAt);
  if ('error' in when) return fail(when.error);
  const transport = smsTransport();
  if (!transport.configured) return fail('SMS is not configured.');

  const loaded = await loadSelection(parsed.data.audience, parsed.data.eventId);
  if (!loaded) return fail('Event not found.');
  const summary = summarize(loaded.selection);
  // Later: people are counted again when it goes out.
  if (summary.recipients === 0 && !when.at)
    return fail('Nobody in this audience has a phone number for SMS.');

  // The provider's own check of each message (nothing sent or charged).
  const checkPhone =
    (await ownPhone(user)) ?? loaded.selection.recipients[0]?.phone ?? null;
  if (checkPhone)
    for (const part of split.parts) {
      const res = await transport.check(checkPhone, part);
      if (!res.ok) return fail(`SMSHub: ${res.message}`);
    }

  return ok({
    scheduledAt: when.at?.toISOString() ?? null,
    parts: split.parts,
    signature: smsSignature(),
    summary,
    credits: estimateCredits(split.parts.length, summary),
    balance: transport.hasBalance ? await transport.balance() : null,
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

  const split = splitRefusal(parsed.data.text);
  if ('error' in split) return fail(split.error);
  const when = scheduledMoment(parsed.data.sendAt);
  if ('error' in when) return fail(when.error);
  const transport = smsTransport();
  if (!transport.configured) return fail('SMS is not configured.');

  const loaded = await loadSelection(parsed.data.audience, parsed.data.eventId);
  if (!loaded) return fail('Event not found.');

  if (when.at) {
    const scheduledAt = when.at;
    if (!(await hitRateLimit(db, `sms:broadcast:${user.id}`, 3600, 5)))
      return fail('At most 5 messages per hour. Please wait a while.');
    const id = await db.transaction((tx) =>
      insertScheduledBroadcast(tx, {
        text: parsed.data.text.trim(),
        parts: split.parts,
        audience: parsed.data.audience,
        eventId: parsed.data.audience === 'event' ? parsed.data.eventId : null,
        createdBy: user.id,
        scheduledAt,
      }),
    );
    revalidatePath('/admin/messages');
    return ok({ id });
  }

  const summary = summarize(loaded.selection);
  if (summary.recipients === 0) return fail('Nobody in this audience has a phone number for SMS.');

  if (transport.charges) {
    const balance = await transport.balance();
    const credits = estimateCredits(split.parts.length, summary);
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
      text: parsed.data.text.trim(),
      parts: split.parts,
      audience: parsed.data.audience,
      eventId: parsed.data.audience === 'event' ? parsed.data.eventId : null,
      origin: 'manual',
      createdBy: user.id,
      selection: loaded.selection,
    }),
  );
  revalidatePath('/admin/messages');
  return ok({ id });
}

/**
 * Sends the messages to the sender's own phone (linked member or
 * pre-member record), in order. Permission: canSendMessages; 5 per hour.
 */
export async function sendTestToSelf(input: {
  text: string;
}): Promise<ActionResult<{ sent: number }>> {
  const user = await requireSender();
  if (!user) return fail(NOT_ALLOWED);
  const text = z.string().max(MAX_TEXT).safeParse(input.text);
  if (!text.success) return fail('Invalid input.');
  const split = splitRefusal(text.data);
  if ('error' in split) return fail(split.error);
  const transport = smsTransport();
  if (!transport.configured) return fail('SMS is not configured.');
  const phone = await ownPhone(user);
  if (!phone) return fail('Your profile has no phone number for SMS.');
  if (!(await hitRateLimit(db, `sms:test:${user.id}`, 3600, 5)))
    return fail('At most 5 test messages per hour. Please wait a while.');

  let sent = 0;
  for (const part of split.parts) {
    const res = await transport.send(phone, part);
    if (!res.ok) return fail(`SMSHub: ${res.message}`);
    sent += 1;
  }
  return ok({ sent });
}

const idSchema = z.guid('Message not found.');

/**
 * Changes a scheduled broadcast (text, audience, time) before it goes out.
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
  const split = splitRefusal(parsed.data.text);
  if ('error' in split) return fail(split.error);
  const when = scheduledMoment(parsed.data.sendAt);
  if ('error' in when) return fail(when.error);
  if (!when.at) return fail('Choose a date and time.');
  if (!(await loadSelection(parsed.data.audience, parsed.data.eventId)))
    return fail('Event not found.');

  // The worker locks the row when it fires: then the status is no longer
  // 'scheduled' and nothing changes.
  const [done] = await db
    .update(messageBroadcasts)
    .set({
      text: parsed.data.text.trim(),
      parts: split.parts,
      audience: parsed.data.audience,
      eventId: parsed.data.audience === 'event' ? parsed.data.eventId : null,
      scheduledAt: when.at,
    })
    .where(
      and(eq(messageBroadcasts.id, b.id), eq(messageBroadcasts.status, 'scheduled')),
    )
    .returning({ id: messageBroadcasts.id });
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
