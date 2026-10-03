'use client';

import { ThemeProvider } from 'next-themes';
import type { Locale } from '@/lib/i18n/config';
import { LocaleProvider } from '@/lib/i18n/client';

export function Providers({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <LocaleProvider locale={locale}>{children}</LocaleProvider>
    </ThemeProvider>
  );
}
