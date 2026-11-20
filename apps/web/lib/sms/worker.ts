/**
 * Background SMS worker, started once per server process from
 * instrumentation.ts. No extra infrastructure: it polls Postgres.
 *
 * Each tick:
 * 1. fires due event reminders and scheduled broadcasts (row lock, so two
 *    processes never fire the same one): works out the recipients right now
 *    and queues the broadcast; more than 12 hours late = missed;
 * 2. starts queued broadcasts: checks the message with the provider (and
 *    the balance for real sends), then 'sending', or 'paused' with the reason;
 * 3. sends one message: claims the next delivery of a recipient
 *    (FOR UPDATE SKIP LOCKED), marks it 'sending' and commits BEFORE the
 *    HTTP call, then writes the result (lib/sms/worker-rules.ts).
 *
 * Since #150 a broadcast is one message per recipient: the provider takes
 * the whole text (up to 10 SMS parts) and the phone joins the parts.
 * Broadcasts queued before that with several numbered parts finish as they
 * were (part n+1 only after part n).
 *
 * About one request every 1.1 s, and at most SEND_MAX per SEND_WINDOW_S
 * seconds across all processes (rate_limits), under SMSHub's 60 per minute.
 * At startup and every few minutes, messages 'sending' for more than 2
 * minutes become 'unknown' and are never resent (no idempotency key at
 * SMSHub).
 *
 * Logs never contain phone numbers or message text.
 */
import 'server-only';
import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  authUsers,
  db,
  eventReminders,
  events,
  messageBroadcasts,
  messageDeliveries,
  messageRecipients,
} from '@felege-yordanos/db/server';
import { smsReminderPausedEmail, smsScheduledPausedEmail } from '../email-templates';
import { sendEmail } from '../email';
import { hitRateLimit } from '../rate-limit';
import {
  insertBroadcast,
  insertRecipients,
  loadBroadcastTargets,
  loadSelection,
} from './message-queries';
import { REMINDER_GRACE_MS } from './reminder-time';
import { reminderText } from './reminders';
import { composeSms, estimateCredits } from './split';
import { smsSignature, smsTransport, type SmsTransport } from './transport';
import {
  applyOutcome,
  INTERRUPTED_AFTER_MS,
  nextDelayMs,
  reminderDecision,
  scheduledBroadcastDecision,
} from './worker-rules';

const IDLE_MS = 5000;
const REMINDER_EVERY_MS = 30_000;
const RECOVER_EVERY_MS = 3 * 60_000;
const SEND_WINDOW_S = 10;
const SEND_MAX = 9;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const short = (id: string) => id.slice(0, 8);
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/* ─── Recovery ────────────────────────────────────────────── */

/**
 * Messages 'sending' for more than 2 minutes (left by a stopped or crashed
 * process): 'unknown', and their recipient 'failed'. Younger ones may still
 * be in flight in another process (deploys briefly run two). Returns how
 * many. Never resent.
 */
export async function recoverInterruptedDeliveries(): Promise<number> {
  return db.transaction(async (tx) => {
    const stale = await tx
      .update(messageDeliveries)
      .set({ status: 'unknown', errorType: 'interrupted', updatedAt: sql`now()` })
      .where(
        and(
          eq(messageDeliveries.status, 'sending'),
          sql`${messageDeliveries.updatedAt} < now() - make_interval(secs => ${INTERRUPTED_AFTER_MS / 1000})`,
        ),
      )
      .returning({ recipientId: messageDeliveries.recipientId });
    if (stale.length)
      await tx
        .update(messageRecipients)
        .set({ status: 'failed', updatedAt: sql`now()` })
        .where(
          inArray(
            messageRecipients.id,
            stale.map((s) => s.recipientId),
          ),
        );
    return stale.length;
  });
}

/* ─── Reminders ───────────────────────────────────────────── */

/** Fires the reminders that are due. Returns how many broadcasts it created. */
export async function fireDueReminders(now: Date = new Date()): Promise<number> {
  let fired = 0;
  for (;;) {
    const done = await db.transaction(async (tx) => {
      const [row] = await tx
        .select({ reminder: eventReminders, event: events })
        .from(eventReminders)
        .leftJoin(events, eq(events.id, eventReminders.eventId))
        .where(
          and(
            eq(eventReminders.status, 'scheduled'),
            sql`${eventReminders.dueAt} <= ${now.toISOString()}::timestamptz`,
          ),
        )
        .orderBy(eventReminders.dueAt)
        .limit(1)
        .for('update', { of: eventReminders, skipLocked: true });
      if (!row) return true;
      const { reminder, event } = row;
      const decision = reminderDecision(reminder, event, now, REMINDER_GRACE_MS);
      if (decision === 'missed' || decision === 'cancelled') {
        await tx
          .update(eventReminders)
          .set({ status: decision })
          .where(eq(eventReminders.id, reminder.id));
        console.log(`[sms] reminder ${short(reminder.id)} ${decision}`);
        return false;
      }
      if (decision !== 'fire' || !event) return true;

      const text = reminderText(reminder, event);
      const sms = composeSms(text, smsSignature());
      const loaded = sms.ok ? await loadSelection('event', event.id) : null;
      if (!sms.ok || !loaded) {
        await tx
          .update(eventReminders)
          .set({ status: 'missed' })
          .where(eq(eventReminders.id, reminder.id));
        console.error(`[sms] reminder ${short(reminder.id)} could not be built`);
        return false;
      }
      const broadcastId = await insertBroadcast(tx, {
        text,
        parts: [sms.text],
        smsParts: sms.smsParts,
        audience: 'event',
        eventId: event.id,
        origin: 'event_reminder',
        createdBy: reminder.setBy,
        selection: loaded.selection,
      });
      await tx
        .update(eventReminders)
        .set({ status: 'sent', broadcastId })
        .where(eq(eventReminders.id, reminder.id));
      fired += 1;
      console.log(
        `[sms] reminder ${short(reminder.id)} fired: broadcast ${short(broadcastId)}, ${loaded.selection.recipients.length} recipients`,
      );
      return false;
    });
    if (done) return fired;
  }
}

/* ─── Scheduled broadcasts ────────────────────────────────── */

/**
 * Scheduled broadcasts whose time has come: recipients worked out now (who
 * joined, left or opted out in between is handled; for audience 'selected'
 * each chosen person is checked again), then 'queued' and the
 * usual flow takes over. More than 12 hours late: 'missed', never sent.
 * Returns how many it queued.
 */
export async function fireScheduledBroadcasts(now: Date = new Date()): Promise<number> {
  let fired = 0;
  for (;;) {
    const done = await db.transaction(async (tx) => {
      const [b] = await tx
        .select({
          id: messageBroadcasts.id,
          status: messageBroadcasts.status,
          scheduledAt: messageBroadcasts.scheduledAt,
          text: messageBroadcasts.text,
          parts: messageBroadcasts.parts,
          smsParts: messageBroadcasts.smsParts,
          audience: messageBroadcasts.audience,
          eventId: messageBroadcasts.eventId,
        })
        .from(messageBroadcasts)
        .where(
          and(
            eq(messageBroadcasts.status, 'scheduled'),
            sql`${messageBroadcasts.scheduledAt} <= ${now.toISOString()}::timestamptz`,
          ),
        )
        .orderBy(messageBroadcasts.scheduledAt)
        .limit(1)
        .for('update', { skipLocked: true });
      if (!b) return true;
      const decision = scheduledBroadcastDecision(b, now, REMINDER_GRACE_MS);
      if (decision === 'missed') {
        await tx
          .update(messageBroadcasts)
          .set({ status: 'missed', finishedAt: sql`now()` })
          .where(eq(messageBroadcasts.id, b.id));
        console.log(`[sms] scheduled broadcast ${short(b.id)} missed`);
        return false;
      }
      if (decision !== 'fire') return true;
      // Audience 'selected': the chosen people, each checked again now.
      const targets =
        b.audience === 'selected' ? await loadBroadcastTargets(tx, b.id) : [];
      const loaded = await loadSelection(b.audience, b.eventId, targets);
      if (!loaded) {
        // Audience 'event' and the event was deleted.
        await tx
          .update(messageBroadcasts)
          .set({
            status: 'cancelled',
            pauseReason: 'The event was deleted.',
            finishedAt: sql`now()`,
          })
          .where(eq(messageBroadcasts.id, b.id));
        console.log(`[sms] scheduled broadcast ${short(b.id)} cancelled: event gone`);
        return false;
      }
      // One message, built from the text now: a broadcast scheduled before
      // #150 has several numbered parts stored.
      const sms = composeSms(b.text, smsSignature());
      const message = sms.ok
        ? { parts: [sms.text], smsParts: sms.smsParts }
        : { parts: b.parts, smsParts: b.smsParts };
      await insertRecipients(tx, b.id, message.parts, loaded.selection);
      await tx
        .update(messageBroadcasts)
        .set({ status: 'queued', ...message })
        .where(eq(messageBroadcasts.id, b.id));
      fired += 1;
      console.log(
        `[sms] scheduled broadcast ${short(b.id)} queued: ${loaded.selection.recipients.length} recipients`,
      );
      return false;
    });
    if (done) return fired;
  }
}

/* ─── Starting broadcasts ─────────────────────────────────── */

async function pauseBroadcast(
  tx: Tx | typeof db,
  broadcastId: string,
  reason: string,
  errorType: string,
) {
  const [b] = await tx
    .update(messageBroadcasts)
    .set({ status: 'paused', pauseReason: reason })
    .where(
      and(
        eq(messageBroadcasts.id, broadcastId),
        inArray(messageBroadcasts.status, ['queued', 'sending']),
      ),
    )
    .returning({
      origin: messageBroadcasts.origin,
      createdBy: messageBroadcasts.createdBy,
      eventId: messageBroadcasts.eventId,
      scheduledAt: messageBroadcasts.scheduledAt,
      text: messageBroadcasts.text,
    });
  if (!b) return;
  console.log(`[sms] broadcast ${short(broadcastId)} paused: ${errorType}`);
  if (b.origin !== 'event_reminder') {
    // Nobody is watching a scheduled message go out: tell its sender.
    if (b.scheduledAt && errorType === 'insufficient_credits' && b.createdBy)
      void emailScheduledPaused(broadcastId, b.createdBy, b.text);
    return;
  }
  await tx
    .update(eventReminders)
    .set({ status: 'paused' })
    .where(eq(eventReminders.broadcastId, broadcastId));
  if (errorType === 'insufficient_credits' && b.createdBy)
    void emailReminderPaused(broadcastId, b.createdBy, b.eventId);
}

async function emailReminderPaused(
  broadcastId: string,
  userId: string,
  eventId: string | null,
) {
  try {
    const [row] = await db
      .select({ email: authUsers.email, title: events.title })
      .from(authUsers)
      .leftJoin(events, eventId ? eq(events.id, eventId) : sql`false`)
      .where(eq(authUsers.id, userId))
      .limit(1);
    if (!row?.email) return;
    const base = process.env['BETTER_AUTH_URL'] ?? '';
    await sendEmail({
      to: row.email,
      ...smsReminderPausedEmail({
        eventTitle: row.title ?? '',
        url: `${base}/admin/messages/${broadcastId}`,
      }),
    });
  } catch (err) {
    console.error('[sms] reminder paused email failed:', errMsg(err));
  }
}

async function emailScheduledPaused(broadcastId: string, userId: string, text: string) {
  try {
    const [row] = await db
      .select({ email: authUsers.email })
      .from(authUsers)
      .where(eq(authUsers.id, userId))
      .limit(1);
    if (!row?.email) return;
    const base = process.env['BETTER_AUTH_URL'] ?? '';
    const flat = text.replace(/\s+/g, ' ').trim();
    await sendEmail({
      to: row.email,
      ...smsScheduledPausedEmail({
        textPreview: flat.length > 80 ? `${flat.slice(0, 80)}…` : flat,
        url: `${base}/admin/messages/${broadcastId}`,
      }),
    });
  } catch (err) {
    console.error('[sms] scheduled paused email failed:', errMsg(err));
  }
}

/**
 * Moves queued broadcasts to 'sending' after checking the message with the
 * provider once (and, for real sends, the balance). Any error pauses the
 * broadcast with the provider's message.
 */
export async function startQueuedBroadcasts(transport: SmsTransport) {
  const queued = await db
    .select({
      id: messageBroadcasts.id,
      parts: messageBroadcasts.parts,
      smsParts: messageBroadcasts.smsParts,
    })
    .from(messageBroadcasts)
    .where(eq(messageBroadcasts.status, 'queued'))
    .orderBy(messageBroadcasts.createdAt)
    .limit(5);
  for (const b of queued) {
    const recipients = await db
      .select({ phone: messageRecipients.phone, network: messageRecipients.network })
      .from(messageRecipients)
      .where(
        and(
          eq(messageRecipients.broadcastId, b.id),
          inArray(messageRecipients.status, ['queued', 'sending']),
        ),
      );
    const first = recipients.find((r) => r.phone)?.phone;
    if (first) {
      if (!transport.configured) {
        await pauseBroadcast(db, b.id, 'SMS is not configured.', 'not_configured');
        continue;
      }
      if (transport.charges) {
        const balance = await transport.balance();
        const safaricom = recipients.filter((r) => r.network === 'safaricom').length;
        const needed = estimateCredits(b.smsParts, {
          ethio: recipients.length - safaricom,
          safaricom,
        });
        if (balance !== null && balance < needed) {
          await pauseBroadcast(
            db,
            b.id,
            `Not enough SMS credits: ${balance} left, about ${needed} needed.`,
            'insufficient_credits',
          );
          continue;
        }
      }
      let failed = false;
      for (const part of b.parts) {
        const res = await transport.check(first, part);
        if (!res.ok) {
          await pauseBroadcast(db, b.id, res.message, res.errorType);
          failed = true;
          break;
        }
        // Our count against the provider's (once per broadcast; the stored
        // credits come from the provider's credits_used anyway).
        if (b.parts.length === 1 && res.parts !== null && res.parts !== b.smsParts)
          console.warn(
            `[sms] broadcast ${short(b.id)}: provider counts ${res.parts} SMS parts, app ${b.smsParts}`,
          );
        await sleep(1100);
      }
      if (failed) continue;
    }
    await db
      .update(messageBroadcasts)
      .set({ status: 'sending', startedAt: sql`coalesce(${messageBroadcasts.startedAt}, now())` })
      .where(and(eq(messageBroadcasts.id, b.id), eq(messageBroadcasts.status, 'queued')));
    console.log(
      `[sms] broadcast ${short(b.id)} sending: ${recipients.length} recipients, ${b.parts.length} message(s), ${b.smsParts} SMS part(s) each`,
    );
  }
}

/** Broadcasts with nobody left to send to are done. */
export async function finishDoneBroadcasts() {
  const done = await db.execute(sql`
    UPDATE ${messageBroadcasts} b
    SET status = 'done', finished_at = now()
    WHERE b.status = 'sending'
      AND NOT EXISTS (
        SELECT 1 FROM ${messageRecipients} r
        WHERE r.broadcast_id = b.id AND r.status IN ('queued', 'sending')
      )
    RETURNING b.id
  `);
  for (const r of done as unknown as { id: string }[])
    console.log(`[sms] broadcast ${short(r.id)} done`);
}

/* ─── Sending ─────────────────────────────────────────────── */

interface Claimed {
  deliveryId: number;
  partNo: number;
  attempts: number;
  recipientId: number;
  phone: string;
  broadcastId: string;
  parts: string[];
}

/**
 * Claims the next message to send: the recipient's delivery (one per
 * recipient since #150; for older numbered broadcasts part n+1 only once
 * part n is 'sent': recipients.next_part), of a broadcast that is sending,
 * everyone's part 1 before anyone's part 2. Marks it 'sending' and commits
 * before returning.
 */
async function claimNext(): Promise<Claimed | null> {
  return db.transaction(async (tx) => {
    const rows = (await tx.execute(sql`
      SELECT d.id AS delivery_id, d.part_no, d.attempts, r.id AS recipient_id,
             r.phone, b.id AS broadcast_id, b.parts
      FROM ${messageDeliveries} d
      JOIN ${messageRecipients} r ON r.id = d.recipient_id
      JOIN ${messageBroadcasts} b ON b.id = r.broadcast_id
      WHERE d.status = 'queued'
        AND d.part_no = r.next_part
        AND r.status IN ('queued', 'sending')
        AND b.status = 'sending'
      ORDER BY b.created_at, d.part_no, r.id
      LIMIT 1
      FOR UPDATE OF d, r SKIP LOCKED
    `)) as unknown as {
      delivery_id: number | string;
      part_no: number;
      attempts: number;
      recipient_id: number | string;
      phone: string | null;
      broadcast_id: string;
      parts: string[];
    }[];
    const row = rows[0];
    if (!row || !row.phone) return null;
    const deliveryId = Number(row.delivery_id);
    await tx
      .update(messageDeliveries)
      .set({ status: 'sending', updatedAt: sql`now()` })
      .where(eq(messageDeliveries.id, deliveryId));
    return {
      deliveryId,
      partNo: row.part_no,
      attempts: row.attempts,
      recipientId: Number(row.recipient_id),
      phone: row.phone,
      broadcastId: row.broadcast_id,
      parts: row.parts,
    };
  });
}

/**
 * Sends one message if there is one. Returns the delay before the next
 * request, or null when there was nothing to send.
 */
export async function sendNext(transport: SmsTransport): Promise<number | null> {
  // Shared across processes (a deploy briefly runs two).
  if (!(await hitRateLimit(db, 'sms:send', SEND_WINDOW_S, SEND_MAX)))
    return 1500;
  const job = await claimNext();
  if (!job) return null;

  const text = job.parts[job.partNo - 1];
  const result = await transport.send(job.phone, text);
  const t = applyOutcome({
    outcome: result.ok ? { ok: true } : { ok: false, kind: result.kind },
    attempts: job.attempts,
    partNo: job.partNo,
    totalParts: job.parts.length,
  });

  await db.transaction(async (tx) => {
    // Only if still ours: a restart elsewhere may have marked it 'unknown'.
    const [updated] = await tx
      .update(messageDeliveries)
      .set({
        status: t.delivery,
        attempts: t.attempts,
        providerMessageId: result.ok ? result.messageId : null,
        errorType: result.ok ? null : result.errorType,
        creditsUsed: result.ok ? result.creditsUsed : null,
        sentAt: result.ok ? sql`now()` : null,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(messageDeliveries.id, job.deliveryId),
          eq(messageDeliveries.status, 'sending'),
        ),
      )
      .returning({ id: messageDeliveries.id });
    if (!updated) return;
    await tx
      .update(messageRecipients)
      .set({
        status: t.recipient,
        nextPart: t.delivery === 'sent' ? job.partNo + 1 : sql`${messageRecipients.nextPart}`,
        updatedAt: sql`now()`,
      })
      .where(eq(messageRecipients.id, job.recipientId));
    if (t.pauseBroadcast && !result.ok)
      await pauseBroadcast(tx, job.broadcastId, result.message, result.errorType);
  });

  console.log(
    `[sms] ${short(job.broadcastId)} recipient ${job.recipientId} part ${job.partNo}/${job.parts.length}: ${result.ok ? 'sent' : `${t.delivery} (${result.errorType})`}`,
  );
  return nextDelayMs(result.rate);
}

/* ─── Loop ────────────────────────────────────────────────── */

const globalForWorker = globalThis as unknown as { smsWorkerStarted?: boolean };

/** Starts the worker once per process. */
export function startSmsWorker() {
  if (globalForWorker.smsWorkerStarted) return;
  globalForWorker.smsWorkerStarted = true;
  void run();
}

async function run() {
  const transport = smsTransport();
  console.log(
    `[sms] worker started (transport ${transport.name}${transport.configured ? '' : ', not configured'})`,
  );
  let lastReminders = 0;
  let lastRecover = 0;
  for (;;) {
    let delay = IDLE_MS;
    try {
      // At startup and every few minutes (a crash leaves messages 'sending').
      if (Date.now() - lastRecover >= RECOVER_EVERY_MS) {
        lastRecover = Date.now();
        const recovered = await recoverInterruptedDeliveries();
        if (recovered)
          console.log(`[sms] ${recovered} interrupted message(s) marked unknown`);
      }
      if (Date.now() - lastReminders >= REMINDER_EVERY_MS) {
        lastReminders = Date.now();
        await fireDueReminders();
        await fireScheduledBroadcasts();
      }
      await startQueuedBroadcasts(transport);
      const next = await sendNext(transport);
      if (next !== null) delay = next;
      else await finishDoneBroadcasts();
    } catch (err) {
      console.error('[sms] worker error:', errMsg(err));
    }
    await sleep(delay);
  }
}
