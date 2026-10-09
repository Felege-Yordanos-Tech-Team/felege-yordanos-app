export const LOCALES = ['am', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'am';
export const LOCALE_COOKIE = 'fy-lang';
/** The language choice is kept for a year. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const isLocale = (v: unknown): v is Locale =>
  typeof v === 'string' && (LOCALES as readonly string[]).includes(v);

/** BCP 47 tag for Intl formatting (dates, numbers). */
export const intlLocale = (l: Locale) => (l === 'am' ? 'am-ET' : 'en-US');
