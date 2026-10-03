'use client';

import { useLocale, useT } from '@/lib/i18n/client';
import { bilingual } from '@/lib/i18n/translate';
import { cn } from '@/lib/utils';

/** Page title block: eyebrow, title, optional subtitle and actions. */
export function PageHead({
  en,
  am,
  sub,
  actions,
  className,
}: {
  en: string;
  am?: string;
  /** English subtitle; translated with the dictionary. */
  sub?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  const locale = useLocale();
  const t = useT();
  const { primary, secondary } = bilingual(locale, en, am);
  return (
    <div className={cn('mb-4 flex items-end justify-between gap-4', className)}>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'text-xs tracking-[0.06em] text-gold-deep',
            locale === 'am' ? 'font-display' : 'font-ethiopic',
          )}
        >
          {secondary}
        </div>
        <h1
          className={cn(
            'mt-0.5 text-brand-ink',
            locale === 'am'
              ? 'font-ethiopic text-[28px] font-semibold'
              : 'font-display text-[30px] font-medium',
            'leading-[1.05]',
          )}
        >
          {primary}
        </h1>
        {sub && <p className="mt-1.5 text-xs text-ink-muted">{t(sub)}</p>}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
