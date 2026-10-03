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

/** Weekday names (Sunday first). */
export const WEEKDAY_EN = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
export const WEEKDAY_AM = ['እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'];

/** Full weekday name for a date, e.g. "Monday" (or "ሰኞ" in Amharic). */
export function weekdayLabel(ymd: string, locale: 'am' | 'en' = 'en'): string {
  const i = parseYmd(ymd).getDay();
  return (locale === 'am' ? WEEKDAY_AM : WEEKDAY_EN)[i];
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
export function cadencePhrase(
  recurrence: Recurrence,
  startYmd: string,
  locale: 'am' | 'en' = 'en',
): string {
  const weekday = weekdayLabel(startYmd, locale);
  const day = parseYmd(startYmd).getDate();
  if (locale === 'am') {
    if (recurrence === 'weekly') return `በየሳምንቱ ${weekday}`;
    if (recurrence === 'biweekly') return `በየሁለት ሳምንቱ ${weekday}`;
    return `በየወሩ በ${day}ኛው ቀን`;
  }
  if (recurrence === 'weekly') return `every ${weekday}`;
  if (recurrence === 'biweekly') return `every other ${weekday}`;
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

/** CLDR abbreviated Amharic month names (Gregorian). */
const MONTH_AM_SHORT = [
  'ጃንዩ',
  'ፌብሩ',
  'ማርች',
  'ኤፕሪ',
  'ሜይ',
  'ጁን',
  'ጁላይ',
  'ኦገስ',
  'ሴፕቴ',
  'ኦክቶ',
  'ኖቬም',
  'ዲሴም',
];

/**
 * Format a `YYYY-MM-DD` date for display in the current language (local
 * parts, so the day never shifts across time zones). Amharic is formatted by
 * hand so server and browser render the same text (their ICU data differs).
 */
export function formatYmd(
  ymd: string,
  locale: 'am' | 'en',
  opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
): string {
  if (!ymd) return '';
  const d = parseYmd(ymd);
  if (Number.isNaN(d.getTime())) return ymd;
  if (locale === 'am') {
    const parts: string[] = [];
    if (opts.weekday) parts.push(`${WEEKDAY_AM[d.getDay()]}፣`);
    if (opts.month)
      parts.push(
        (opts.month === 'long' ? MONTH_AM : MONTH_AM_SHORT)[d.getMonth()],
      );
    if (opts.day)
      parts.push(
        opts.day === '2-digit'
          ? String(d.getDate()).padStart(2, '0')
          : String(d.getDate()),
      );
    let out = parts.join(' ');
    if (opts.year) out += `${opts.day ? ',' : ''} ${d.getFullYear()}`;
    return out.trim();
  }
  try {
    return new Intl.DateTimeFormat('en-US', opts).format(d);
  } catch {
    return ymd;
  }
}

/** "08:30" from a Postgres time ("08:30:00"), or '' when missing. */
export function hhmm(t: string | null | undefined): string {
  return t ? t.slice(0, 5) : '';
}

// ── Department colours (client-side map; no DB column) ────────────────────────

/**
 * Deterministic colour per department id (used as inline styles for dots,
 * bars and calendar chips). Jewel tones from the design's calendar palette
 * that read on parchment in both light and dark. `null` (General) falls
 * back to a muted ink tone.
 */
const DEPT_COLOR: Record<number, string> = {
  1: '#5B5FA6', // Planning: indigo
  2: '#2E8577', // Education: teal (design "edu")
  3: '#B5532F', // Programs & Events: terracotta
  4: '#8C4A6B', // People Ops: plum
  5: '#C97B1A', // Comms: amber (design "comms")
  6: '#D4A843', // Songs & Celebrations: gold (design "choir")
  7: '#2F6F8F', // Arts & Culture: blue
  8: '#4F7B3E', // Development & Charity: green (design "kids")
  9: '#75664A', // Budget & Asset: umber
};

const DEPT_FALLBACK = '#A89673'; // ink-faint

export function deptColor(id: number | null | undefined): string {
  if (!id) return DEPT_FALLBACK;
  return DEPT_COLOR[id] ?? DEPT_FALLBACK;
}

/** Short labels for legends, chips and other tight spaces. */
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

/** Leading word(s) of each department's official Amharic name. */
const DEPT_SHORT_AM: Record<number, string> = {
  1: 'እቅድ',
  2: 'ትምህርት',
  3: 'መርሐ ግብር',
  4: 'የሰው ሀብት',
  5: 'መረጃ',
  6: 'መዝሙር',
  7: 'ኪነጥበብ',
  8: 'ልማት',
  9: 'በጀት',
};

export function deptShortLabel(
  id: number | null | undefined,
  locale: 'am' | 'en' = 'en',
): string {
  if (!id) return locale === 'am' ? 'ጠቅላላ' : 'General';
  return (
    (locale === 'am' ? DEPT_SHORT_AM[id] : DEPT_SHORT[id]) ??
    (locale === 'am' ? 'ክፍል' : 'Dept')
  );
}

// ── Calendar grid ─────────────────────────────────────────────────────────────

/** Amharic transliteration of Gregorian month names (matches the shown month). */
export const MONTH_AM = [
  'ጃንዋሪ',
  'ፌብሩዋሪ',
  'ማርች',
  'ኤፕሪል',
  'ሜይ',
  'ጁን',
  'ጁላይ',
  'ኦገስት',
  'ሴፕቴምበር',
  'ኦክቶበር',
  'ኖቬምበር',
  'ዲሴምበር',
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
  for (let d = 1; d <= daysInMonth; d += 1)
    cells.push(toYmd(new Date(year, month, d)));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// ── Ethiopian calendar (for the calendar subtitle) ───────────────────────────

export const ETH_MONTHS = [
  'መስከረም',
  'ጥቅምት',
  'ኅዳር',
  'ታኅሣሥ',
  'ጥር',
  'የካቲት',
  'መጋቢት',
  'ሚያዝያ',
  'ግንቦት',
  'ሰኔ',
  'ሐምሌ',
  'ነሐሴ',
  'ጳጉሜን',
];

/** Gregorian date -> Ethiopian { year, month (1-13), day } via the Julian Day Number. */
export function toEthiopic(d: Date): {
  year: number;
  month: number;
  day: number;
} {
  const a = Math.floor((14 - (d.getMonth() + 1)) / 12);
  const y = d.getFullYear() + 4800 - a;
  const m = d.getMonth() + 1 + 12 * a - 3;
  const jdn =
    d.getDate() +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  const r = (jdn - 1723856) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  return {
    year:
      4 * Math.floor((jdn - 1723856) / 1461) +
      Math.floor(r / 365) -
      Math.floor(r / 1460),
    month: Math.floor(n / 30) + 1,
    day: (n % 30) + 1,
  };
}

const G1 = ['', '፩', '፪', '፫', '፬', '፭', '፮', '፯', '፰', '፱'];
const G10 = ['', '፲', '፳', '፴', '፵', '፶', '፷', '፸', '፹', '፺'];
const geezPair = (n: number) => G10[Math.floor(n / 10)] + G1[n % 10];

/** Number in Ge'ez numerals (1-9999), e.g. 2018 -> ፳፻፲፰. */
export function geez(n: number): string {
  if (n < 100) return geezPair(n);
  const hi = Math.floor(n / 100);
  const lo = n % 100;
  return (hi === 1 ? '' : geezPair(hi)) + '፻' + geezPair(lo);
}
