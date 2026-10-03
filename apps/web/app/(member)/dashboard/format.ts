import { intlLocale, type Locale } from '@/lib/i18n/config';

/** True when the text contains Ge'ez script (pick the Ethiopic font for it). */
export const hasEthiopic = (s: string) => /[ሀ-᎟ⶀ-⷟]/.test(s);

/** "May 18" / "ሜይ 18" for a stored YYYY-MM-DD date (read as a calendar date, no timezone shift). */
export function shortDate(value: string, locale: Locale): string {
  const d = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

/** "May 11" for a timestamp. */
export function shortDateTime(value: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    month: 'short',
    day: 'numeric',
  }).format(value);
}

/** Thousands-separated number in the current language. */
export function formatNumber(n: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(n);
}

/** "ETB 1,500" in English, "1,500 ብር" in Amharic (other currencies keep their code). */
export function formatAmount(
  amount: number,
  currency: string | null,
  locale: Locale,
): string {
  const n = formatNumber(amount, locale);
  const cur = currency || 'ETB';
  if (locale === 'am' && cur === 'ETB') return `${n} ብር`;
  return `${cur} ${n}`;
}
