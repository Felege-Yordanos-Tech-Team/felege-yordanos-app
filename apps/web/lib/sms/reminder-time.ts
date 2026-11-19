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
import { eatMoment, isTooSoon, TIME_PASSED } from './schedule';

export const REMINDER_DEFAULT_DAYS = 2;
export const REMINDER_MAX_DAYS = 14;
/** Default clock time (EAT) of a reminder on its day. */
export const REMINDER_DEFAULT_TIME = '09:00';
/** A reminder later than this is skipped as missed, never sent late. */
export const REMINDER_GRACE_MS = 12 * 60 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * When the reminder for an event on `eventDate` (YYYY-MM-DD, EAT) goes out:
 * `sendTime` (HH:MM, EAT; default 09:00), `daysBefore` days before that date.
 */
export function reminderDueAt(
  eventDate: string,
  daysBefore: number,
  sendTime: string = REMINDER_DEFAULT_TIME,
): Date {
  return new Date(eatMoment(eventDate, sendTime).getTime() - daysBefore * DAY_MS);
}

/** Too late to send: more than 12 hours after the due time. */
export const isMissed = (dueAt: Date, now: Date) =>
  now.getTime() - dueAt.getTime() > REMINDER_GRACE_MS;

/**
 * Why this reminder cannot be set, or null: it would go out after the event
 * has started, or its time has passed or is less than 2 minutes away.
 * `now` null skips the time check (a stored reminder whose time does not
 * change).
 */
export function reminderRefusal(
  event: { eventDate: string; startTime: string | null },
  daysBefore: number,
  sendTime: string,
  now: Date | null,
): string | null {
  const due = reminderDueAt(event.eventDate, daysBefore, sendTime);
  if (event.startTime && due.getTime() >= eventStartAt(event).getTime())
    return 'The reminder would be sent after the event starts.';
  if (now && isTooSoon(due, now)) return TIME_PASSED;
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
  /** "HH:MM", EAT. */
  sendTime: string;
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
  /** "HH:MM", EAT. */
  sendTime: string;
  /** null = the default text built from the event. */
  text: string | null;
}
