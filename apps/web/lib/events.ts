/**
 * Event + recurrence helpers.
 *
 * Recurring events are *materialized*: creating a series inserts one `events`
 * row per occurrence, all sharing a `recurrence_group` uuid. This module holds
 * the pure date math (no React) so both the create modal and any server code
 * can share it. See the recurring-events design notes: cadence never changes
 * after creation, the horizon is capped at 12 months, and occurrences that
 * already carry attendance are frozen.
 */

export type Recurrence = 'weekly' | 'biweekly' | 'monthly';

/** How far out a single series may be scheduled. */
export const MAX_RECURRENCE_MONTHS = 12;

/** Hard backstop on generated rows (12mo weekly ≈ 53; this only catches bugs). */
const MAX_OCCURRENCES = 600;

// ── Date helpers (local, part-based — no UTC/DST drift) ───────────────────────

/** Parse a `YYYY-MM-DD` string into a local Date at midnight. */
export function parseYmd(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Format a Date back to `YYYY-MM-DD` (local parts). */
export function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Add whole months, clamping the day to the target month's length. */
function addMonthsClamped(date: Date, months: number): Date {
  const first = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const daysInMonth = new Date(
    first.getFullYear(),
    first.getMonth() + 1,
    0,
  ).getDate();
  return new Date(
    first.getFullYear(),
    first.getMonth(),
    Math.min(date.getDate(), daysInMonth),
  );
}

/** Today as `YYYY-MM-DD` (local). */
export function todayYmd(): string {
  return toYmd(new Date());
}

/** The furthest Until date allowed for a series starting on `startYmd`. */
export function maxRecurrenceUntil(startYmd: string): string {
  return toYmd(addMonthsClamped(parseYmd(startYmd), MAX_RECURRENCE_MONTHS));
}

/** Full weekday name for a date, e.g. "Monday". */
export function weekdayLabel(ymd: string): string {
  return parseYmd(ymd).toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Every occurrence date (inclusive) from `startYmd` to `untilYmd` for a cadence.
 * Weekly/biweekly step by days; monthly repeats the same day-of-month (clamped).
 */
export function generateOccurrences(
  startYmd: string,
  recurrence: Recurrence,
  untilYmd: string,
): string[] {
  const start = parseYmd(startYmd);
  const until = parseYmd(untilYmd);
  if (until < start) return [startYmd];

  const out: string[] = [];

  if (recurrence === 'monthly') {
    let i = 0;
    let cur = start;
    while (cur <= until && out.length < MAX_OCCURRENCES) {
      out.push(toYmd(cur));
      i += 1;
      cur = addMonthsClamped(start, i);
    }
  } else {
    const step = recurrence === 'weekly' ? 7 : 14;
    const cur = new Date(start);
    while (cur <= until && out.length < MAX_OCCURRENCES) {
      out.push(toYmd(cur));
      cur.setDate(cur.getDate() + step);
    }
  }

  return out;
}

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
};

/** Human phrase for a cadence on a given weekday, e.g. "every Monday". */
export function cadencePhrase(recurrence: Recurrence, startYmd: string): string {
  const weekday = weekdayLabel(startYmd);
  if (recurrence === 'weekly') return `every ${weekday}`;
  if (recurrence === 'biweekly') return `every other ${weekday}`;
  const day = parseYmd(startYmd).getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? 'st'
      : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
          ? 'rd'
          : 'th';
  return `monthly on the ${day}${suffix}`;
}

// ── Department colours (client-side map; no DB column) ────────────────────────

/**
 * Deterministic colour per department id. Jewel tones that read on parchment in
 * both light and dark. `null` (General) falls back to a muted ink tone.
 */
const DEPT_COLOR: Record<number, string> = {
  1: '#5B5FA6', // Planning — indigo
  2: '#2F6F8F', // Education — teal-blue
  3: '#6B1D2A', // Programs & Events — burgundy
  4: '#8C4A6B', // People Ops — plum
  5: '#C97B1A', // Comms — amber
  6: '#A47A18', // Songs & Celebrations — gold-deep
  7: '#B5532F', // Arts & Culture — terracotta
  8: '#4F7B3E', // Development & Charity — green
  9: '#3E7C6A', // Budget & Asset — emerald
};

const DEPT_FALLBACK = '#75664A'; // ink-muted

export function deptColor(id: number | null | undefined): string {
  if (!id) return DEPT_FALLBACK;
  return DEPT_COLOR[id] ?? DEPT_FALLBACK;
}

/** Short English label for legends/tight spaces. */
const DEPT_SHORT: Record<number, string> = {
  1: 'Planning',
  2: 'Education',
  3: 'Programs',
  4: 'People',
  5: 'Comms',
  6: 'Songs',
  7: 'Arts',
  8: 'Charity',
  9: 'Budget',
};

export function deptShortLabel(id: number | null | undefined): string {
  if (!id) return 'General';
  return DEPT_SHORT[id] ?? 'Dept';
}

// ── Calendar grid ─────────────────────────────────────────────────────────────

/** Amharic transliteration of Gregorian month names (matches the shown month). */
export const MONTH_AM = [
  'ጃንዋሪ', 'ፌብሩዋሪ', 'ማርች', 'ኤፕሪል', 'ሜይ', 'ጁን',
  'ጁላይ', 'ኦገስት', 'ሴፕቴምበር', 'ኦክቶበር', 'ኖቬምበር', 'ዲሴምበር',
];

/**
 * A month laid out as calendar weeks (Sun-first). Each cell is a `YYYY-MM-DD`
 * string or `null` for leading/trailing padding days.
 */
export function monthGrid(year: number, month: number): (string | null)[][] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDay; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(toYmd(new Date(year, month, d)));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
