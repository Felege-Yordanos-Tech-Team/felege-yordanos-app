'use client';

import { createContext, useContext, useMemo } from 'react';
import { DEFAULT_LOCALE, type Locale } from './config';
import { bilingual, createTranslator } from './translate';

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);

/** Client components: const t = useT(); t('Upcoming events') */
export function useT() {
  const locale = useLocale();
  return useMemo(() => createTranslator(locale), [locale]);
}

/** { primary, secondary } heading pair for the current language. */
export function useBilingual() {
  const locale = useLocale();
  return (en: string, am?: string) => bilingual(locale, en, am);
}
