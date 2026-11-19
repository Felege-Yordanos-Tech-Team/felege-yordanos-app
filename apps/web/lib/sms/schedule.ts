/**
 * When a scheduled SMS may go out (event reminders and "send later" on the
 * compose page). Pure: `now` is a parameter. Times are Ethiopian local time
 * (Africa/Addis_Ababa, UTC+3 all year).
 */
import { eatInstant } from '../check-in-window';

/** A scheduled time must be at least this far ahead when it is saved. */
export const MIN_LEAD_MS = 2 * 60 * 1000;
/** "Send later": at most this many days ahead. */
export const MAX_SCHEDULE_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

/** One message for a time in the past and a time less than 2 minutes away. */
export const TIME_PASSED = 'This time has already passed. Choose a later time.';
export const TIME_TOO_FAR = 'Choose a time at most 60 days ahead.';

/** "HH:MM" from "HH:MM" or "HH:MM:SS". */
export const hhmmOf = (t: string) => t.slice(0, 5);

/** A valid "HH:MM" (or "HH:MM:SS") clock time. */
export const isClockTime = (t: string) =>
  /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(t);

/** The instant of an EAT date (YYYY-MM-DD) and clock time (HH:MM). */
export function eatMoment(ymd: string, time: string): Date {
  const [hh, mm] = time.split(':').map(Number);
  return eatInstant(ymd, hh, mm);
}

/** The moment is in the past or less than 2 minutes away. */
export const isTooSoon = (at: Date, now: Date) =>
  at.getTime() - now.getTime() < MIN_LEAD_MS;

/**
 * Why a "send later" time cannot be saved, or null: at least 2 minutes and
 * at most 60 days ahead.
 */
export function sendLaterRefusal(at: Date, now: Date): string | null {
  if (Number.isNaN(at.getTime())) return 'Choose a date and time.';
  if (isTooSoon(at, now)) return TIME_PASSED;
  if (at.getTime() - now.getTime() > MAX_SCHEDULE_DAYS * DAY_MS) return TIME_TOO_FAR;
  return null;
}
