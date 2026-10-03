import { AM } from './dictionary';
import type { Locale } from './config';

export type Translate = (en: string, vars?: Record<string, string | number>) => string;

/** Builds t(): returns the Amharic for an English string, or the English itself. */
export function createTranslator(locale: Locale): Translate {
  return (en, vars) => {
    let s = locale === 'am' ? (AM[en] ?? en) : en;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
}

/**
 * The design pairs every heading with its translation: the current
 * language leads, the other one is a small accent (eyebrow).
 */
export function bilingual(locale: Locale, en: string, am?: string) {
  const amText = am ?? AM[en] ?? en;
  return locale === 'am'
    ? { primary: amText, secondary: en }
    : { primary: en, secondary: amText };
}
