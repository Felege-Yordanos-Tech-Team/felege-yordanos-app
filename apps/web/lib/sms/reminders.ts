/**
 * Event SMS reminders in the database (event_reminders): set, move with the
 * event, cancel on close. The worker (lib/sms/worker.ts) sends them.
 * Rules (due time, missed, default text) are in lib/sms/reminder-time.ts.
 */
import 'server-only';
import { and, eq, inArray } from 'drizzle-orm';
import { db, eventReminders } from '@felege-yordanos/db/server';
import {
  defaultReminderText,
  reminderDueAt,
  reminderRefusal,
  REMINDER_MAX_DAYS,
  type ReminderView,
} from './reminder-time';
import { hhmmOf, isClockTime } from './schedule';
import { splitSms } from './split';
import { smsSignature } from './transport';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface ReminderEvent {
  id: string;
  title: string;
  eventDate: string;
  startTime: string | null;
}

export interface ReminderInput {
  daysBefore: number;
  /** "HH:MM" (or "HH:MM:SS" as stored), EAT. */
  sendTime: string;
  /** null = the default text built from the event when it is sent. */
  text: string | null;
}


/** The text a reminder sends for this event. */
export const reminderText = (
  reminder: { text: string | null },
  event: Omit<ReminderEvent, 'id'>,
) => reminder.text ?? defaultReminderText(event);

/**
 * Why this reminder cannot be saved for the event, or null: days out of
 * range, sent after the start, a time that has passed or is less than 2
 * minutes away (skipped when `now` is null), or a text that does not fit in
 * 5 SMS.
 */
export function reminderInputRefusal(
  event: Omit<ReminderEvent, 'id'>,
  input: ReminderInput,
  now: Date | null,
): string | null {
  if (
    !Number.isInteger(input.daysBefore) ||
    input.daysBefore < 0 ||
    input.daysBefore > REMINDER_MAX_DAYS
  )
    return 'Days before must be between 0 and 14.';
  if (!isClockTime(input.sendTime)) return 'Choose a time.';
  const refusal = reminderRefusal(
    event,
    input.daysBefore,
    hhmmOf(input.sendTime),
    now,
  );
  if (refusal) return refusal;
  const split = splitSms(reminderText(input, event), smsSignature());
  if (!split.ok) {
    if (split.reason === 'empty') return 'Enter the reminder text.';
    if (split.reason === 'word_too_long')
      return 'The reminder text has a word too long for one SMS.';
    return 'The reminder text needs more than 5 SMS. Shorten it.';
  }
  return null;
}

/**
 * Sets (or replaces) the reminder of an event, as 'scheduled'. Call after
 * reminderInputRefusal (with now) returned null: a time in the past is
 * refused, never stored.
 */
export async function saveReminder(
  tx: Tx,
  event: ReminderEvent,
  input: ReminderInput,
  userId: string,
  now: Date = new Date(),
) {
  const sendTime = hhmmOf(input.sendTime);
  const dueAt = reminderDueAt(event.eventDate, input.daysBefore, sendTime);
  const values = {
    daysBefore: input.daysBefore,
    sendTime,
    text: input.text,
    setBy: userId,
    setAt: now,
    status: 'scheduled' as const,
    broadcastId: null,
    dueAt,
  };
  // An already sent reminder is never sent again: changing it after it went
  // out sets up a new one for the new text and day.
  await tx
    .insert(eventReminders)
    .values({ eventId: event.id, ...values })
    .onConflictDoUpdate({ target: eventReminders.eventId, set: values });
}

/** Removes the reminder of an event (not yet sent or not). */
export async function deleteReminder(tx: Tx, eventId: string) {
  await tx.delete(eventReminders).where(eq(eventReminders.eventId, eventId));
}

/**
 * The event changed (date, time or title) and the form left the reminder
 * alone: a reminder that has not gone out moves with it (same days and
 * time). When it no longer works (its new time has passed or comes after
 * the new start, or the default text no longer fits with the new title):
 * - `strict` (the editor may set reminders): returns the reason, the caller
 *   refuses the save;
 * - otherwise it is cancelled, so editors without the right to send can
 *   still save the event; the form shows the cancelled reminder.
 * A 'missed' reminder becomes 'scheduled' again when its new time works.
 */
export async function rescheduleReminder(
  tx: Tx,
  event: ReminderEvent,
  opts: { strict: boolean; now?: Date },
): Promise<{ refusal: string } | null> {
  const now = opts.now ?? new Date();
  const [r] = await tx
    .select()
    .from(eventReminders)
    .where(eq(eventReminders.eventId, event.id))
    .for('update')
    .limit(1);
  if (!r || (r.status !== 'scheduled' && r.status !== 'missed')) return null;
  const dueAt = reminderDueAt(event.eventDate, r.daysBefore, hhmmOf(r.sendTime));
  const moved = dueAt.getTime() !== r.dueAt.getTime();
  if (r.status === 'missed') {
    if (moved && !reminderInputRefusal(event, r, now))
      await tx
        .update(eventReminders)
        .set({ dueAt, status: 'scheduled' })
        .where(eq(eventReminders.id, r.id));
    return null;
  }
  // The time is only checked when it moves.
  const refusal = reminderInputRefusal(event, r, moved ? now : null);
  if (refusal) {
    if (opts.strict) return { refusal };
    await tx
      .update(eventReminders)
      .set({ status: 'cancelled' })
      .where(eq(eventReminders.id, r.id));
    return null;
  }
  if (moved)
    await tx
      .update(eventReminders)
      .set({ dueAt })
      .where(eq(eventReminders.id, r.id));
  return null;
}

/** Closing an event cancels a reminder that has not gone out. */
export async function cancelReminder(tx: Tx, eventId: string) {
  await tx
    .update(eventReminders)
    .set({ status: 'cancelled' })
    .where(
      and(
        eq(eventReminders.eventId, eventId),
        inArray(eventReminders.status, ['scheduled', 'missed']),
      ),
    );
}

/** Reminders of these events, by event id. */
export async function loadReminders(
  eventIds: string[],
): Promise<Record<string, ReminderView>> {
  if (!eventIds.length) return {};
  const rows = await db
    .select()
    .from(eventReminders)
    .where(inArray(eventReminders.eventId, eventIds));
  return Object.fromEntries(
    rows.map((r) => [
      r.eventId,
      {
        daysBefore: r.daysBefore,
        sendTime: hhmmOf(r.sendTime),
        text: r.text,
        status: r.status,
        dueAt: r.dueAt.toISOString(),
        broadcastId: r.broadcastId,
      },
    ]),
  );
}
