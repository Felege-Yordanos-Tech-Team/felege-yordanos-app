/**
 * SMS reminders before an event: when they are due, when they count as
 * missed, and the default text. Pure.
 *
 * Event dates and times are Ethiopian local time (EAT, UTC+3 all year, no
 * daylight saving), same as lib/check-in-window.ts.
 */
import type { ReminderStatus } from '@felege-yordanos/db/schema';
import { eventStartAt } from '../check-in-window';
import { ETH_MONTHS, parseYmd, toEthiopic, WEEKDAY_AM } from '../events';

export const REMINDER_DEFAULT_DAYS = 2;
export const REMINDER_MAX_DAYS = 14;
/** Reminders are sent at this hour (EAT) on their day. */
export const REMINDER_HOUR_EAT = 9;
/** A reminder later than this is skipped as missed, never sent late. */
export const REMINDER_GRACE_MS = 12 * 60 * 60 * 1000;

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * When the reminder for an event on `eventDate` (YYYY-MM-DD, EAT) goes out:
 * 09:00 EAT, `daysBefore` days before that date.
 */
export function reminderDueAt(eventDate: string, daysBefore: number): Date {
  const [y, m, d] = eventDate.split('-').map(Number);
  const eventDayStartUtc = Date.UTC(y, (m ?? 1) - 1, d ?? 1);
  return new Date(
    eventDayStartUtc -
      daysBefore * DAY_MS +
      REMINDER_HOUR_EAT * 60 * 60 * 1000 -
      EAT_OFFSET_MS,
  );
}

/** Too late to send: more than 12 hours after the due time. */
export const isMissed = (dueAt: Date, now: Date) =>
  now.getTime() - dueAt.getTime() > REMINDER_GRACE_MS;

/**
 * Status of a reminder when it is saved (set or event moved): a due time
 * that has already passed is 'missed' straight away (never sent late).
 */
export const reminderStatusOnSave = (
  dueAt: Date,
  now: Date,
): 'scheduled' | 'missed' => (dueAt.getTime() <= now.getTime() ? 'missed' : 'scheduled');

/**
 * Why this reminder cannot be set, or null: it would go out after the event
 * has started (0 days before an event starting before 09:00).
 */
export function reminderRefusal(
  event: { eventDate: string; startTime: string | null },
  daysBefore: number,
): string | null {
  const due = reminderDueAt(event.eventDate, daysBefore);
  if (event.startTime && due.getTime() >= eventStartAt(event).getTime())
    return 'The reminder would be sent after the event starts.';
  return null;
}

/**
 * Ethiopian clock time for an EAT "HH:MM": the day starts at 6 in the
 * morning (Western 08:30 is "ከጠዋቱ 2:30 ሰዓት").
 */
export function ethiopianClock(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period =
    h >= 6 && h < 12
      ? 'ከጠዋቱ'
      : h >= 12 && h < 18
        ? 'ከቀኑ'
        : h >= 18
          ? 'ከምሽቱ'
          : 'ከሌሊቱ';
  const eh = (h + 6) % 12 || 12;
  return `${period} ${eh}:${String(m).padStart(2, '0')} ሰዓት`;
}

/**
 * The default reminder text, built from the event (in Amharic: the people
 * receiving it read Amharic). The school's name comes first, so people
 * recognise the sender (SMSHub sends from a shared name).
 */
export function defaultReminderText(event: {
  title: string;
  eventDate: string;
  startTime: string | null;
}): string {
  const day = parseYmd(event.eventDate);
  const eth = toEthiopic(day);
  const date = `${WEEKDAY_AM[day.getDay()]} ${ETH_MONTHS[eth.month - 1]} ${eth.day} ቀን ${eth.year} ዓ.ም.`;
  const time = event.startTime
    ? ` ${ethiopianClock(event.startTime.slice(0, 5))} ጀምሮ።`
    : '';
  return `ፈለገ ዮርዳኖስ ሰ/ት/ቤት፦ ${event.title.trim()}፣ ${date}${time} እንዲገኙ እናሳስባለን።`;
}

/** What the event form shows about an event's reminder. */
export interface ReminderView {
  daysBefore: number;
  /** null = the default text built from the event. */
  text: string | null;
  status: ReminderStatus;
  /** ISO instant. */
  dueAt: string;
  broadcastId: string | null;
}

/** What the event form sends: undefined = leave the reminder as it is. */
export interface ReminderFormInput {
  enabled: boolean;
  daysBefore: number;
  /** null = the default text built from the event. */
  text: string | null;
}
