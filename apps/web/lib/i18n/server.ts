import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from './config';
import { createTranslator } from './translate';

/** Current language from the fy-lang cookie (Amharic by default). */
export const getLocale = cache(async (): Promise<Locale> => {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
});

/** Server components: const t = await getT(); t('Upcoming events') */
export async function getT() {
  return createTranslator(await getLocale());
}
