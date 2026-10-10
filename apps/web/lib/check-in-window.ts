/**
 * Check-in window of an event: from `opensBefore` minutes before the start
 * time to `closesAfter` minutes after it. Event dates and times are local
 * Ethiopian time (EAT, UTC+3, no daylight saving); the server runs in UTC, so
 * all math converts EAT wall-clock time to real instants explicitly.
 *
 * Department heads can only check people in while the window is open; admins
 * and super admins at any time (see canCheckInNow in lib/permissions.ts).
 * Pure functions: safe in server and client code.
 */

export const CHECK_IN_DEFAULT_MIN = 20;
export const CHECK_IN_MAX_MIN = 720;

/** Ethiopia is UTC+3 all year. */
const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export interface CheckInWindowEvent {
  eventDate: string; // YYYY-MM-DD (EAT)
  startTime: string | null; // HH:MM or HH:MM:SS (EAT)
  checkInOpensBeforeMin: number;
  checkInClosesAfterMin: number;
}

export interface CheckInWindow {
  opensAt: Date;
  closesAt: Date;
}

export type CheckInState = 'before' | 'open' | 'after';

/** The instant of an EAT wall-clock date and time. */
function eatInstant(ymd: string, hh = 0, mm = 0): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, hh, mm) - EAT_OFFSET_MS);
}

/**
 * When check-in opens and closes. Without a start time, check-in is open for
 * the whole event day (EAT).
 */
export function checkInWindow(event: CheckInWindowEvent): CheckInWindow {
  if (!event.startTime) {
    const opensAt = eatInstant(event.eventDate);
    return {
      opensAt,
      closesAt: new Date(opensAt.getTime() + 24 * 60 * MINUTE_MS),
    };
  }
  const [hh, mm] = event.startTime.split(':').map(Number);
  const start = eatInstant(event.eventDate, hh, mm).getTime();
  return {
    opensAt: new Date(start - event.checkInOpensBeforeMin * MINUTE_MS),
    closesAt: new Date(start + event.checkInClosesAfterMin * MINUTE_MS),
  };
}

/**
 * When the event starts: the start time on the event day (EAT), or the start
 * of the event day when it has no start time.
 */
export function eventStartAt(
  event: Pick<CheckInWindowEvent, 'eventDate' | 'startTime'>,
): Date {
  if (!event.startTime) return eatInstant(event.eventDate);
  const [hh, mm] = event.startTime.split(':').map(Number);
  return eatInstant(event.eventDate, hh, mm);
}

export function checkInState(
  window: CheckInWindow,
  now: Date = new Date(),
): CheckInState {
  if (now < window.opensAt) return 'before';
  if (now >= window.closesAt) return 'after';
  return 'open';
}

/** "08:40" in EAT, for messages. */
export function eatTime(instant: Date): string {
  const d = new Date(instant.getTime() + EAT_OFFSET_MS);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

/** "2026-10-10" in EAT. */
export function eatDate(instant: Date): string {
  return new Date(instant.getTime() + EAT_OFFSET_MS).toISOString().slice(0, 10);
}
