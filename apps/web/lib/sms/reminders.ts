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
  reminderStatusOnSave,
  REMINDER_MAX_DAYS,
  type ReminderView,
} from './reminder-time';
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
 * range, sent after the start, or a text that does not fit in 5 SMS.
 */
export function reminderInputRefusal(
  event: Omit<ReminderEvent, 'id'>,
  input: ReminderInput,
): string | null {
  if (
    !Number.isInteger(input.daysBefore) ||
    input.daysBefore < 0 ||
    input.daysBefore > REMINDER_MAX_DAYS
  )
    return 'Days before must be between 0 and 14.';
  const refusal = reminderRefusal(event, input.daysBefore);
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
 * Sets (or replaces) the reminder of an event. A due time that has passed
 * already makes it 'missed' (never sent late). Call after
 * reminderInputRefusal returned null.
 */
export async function saveReminder(
  tx: Tx,
  event: ReminderEvent,
  input: ReminderInput,
  userId: string,
  now: Date = new Date(),
) {
  const dueAt = reminderDueAt(event.eventDate, input.daysBefore);
  const values = {
    daysBefore: input.daysBefore,
    text: input.text,
    setBy: userId,
    setAt: now,
    status: reminderStatusOnSave(dueAt, now),
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
 * The event changed (date, time or title): a reminder that has not gone out
 * moves with it. When it no longer works (it would come after the new start,
 * or the default text no longer fits with the new title) it is cancelled,
 * so the event can still be saved by editors without the right to send;
 * the form shows the cancelled reminder. Returns whether it was cancelled.
 */
export async function rescheduleReminder(
  tx: Tx,
  event: ReminderEvent,
  now: Date = new Date(),
): Promise<boolean> {
  const [r] = await tx
    .select()
    .from(eventReminders)
    .where(eq(eventReminders.eventId, event.id))
    .for('update')
    .limit(1);
  if (!r || (r.status !== 'scheduled' && r.status !== 'missed')) return false;
  if (reminderInputRefusal(event, r)) {
    await tx
      .update(eventReminders)
      .set({ status: 'cancelled' })
      .where(eq(eventReminders.id, r.id));
    return true;
  }
  const dueAt = reminderDueAt(event.eventDate, r.daysBefore);
  if (dueAt.getTime() === r.dueAt.getTime()) return false;
  await tx
    .update(eventReminders)
    .set({ dueAt, status: reminderStatusOnSave(dueAt, now) })
    .where(eq(eventReminders.id, r.id));
  return false;
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
        text: r.text,
        status: r.status,
        dueAt: r.dueAt.toISOString(),
        broadcastId: r.broadcastId,
      },
    ]),
  );
}
