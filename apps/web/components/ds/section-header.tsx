'use client';

import { useLocale } from '@/lib/i18n/client';
import { bilingual } from '@/lib/i18n/translate';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: { eyebrow: 'text-[11px]', title: 'text-[22px]' },
  md: { eyebrow: 'text-xs', title: 'text-[28px]' },
  lg: { eyebrow: 'text-[13px]', title: 'text-[36px]' },
} as const;

/**
 * Bilingual heading. The current language is the
 * big title; the other language is the small gold eyebrow above it.
 * Pass the English text; Amharic comes from the dictionary unless `am` is given.
 */
export function SectionHeader({
  en,
  am,
  size = 'sm',
  as: Tag = 'h2',
  className,
}: {
  en: string;
  am?: string;
  size?: keyof typeof SIZES;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}) {
  const locale = useLocale();
  const { primary, secondary } = bilingual(locale, en, am);
  const s = SIZES[size];
  return (
    <div className={cn('min-w-0', className)}>
      <div
        className={cn(
          'mb-1.5 font-medium tracking-[0.08em] text-gold-deep',
          locale === 'am' ? 'font-display' : 'font-ethiopic',
          s.eyebrow,
        )}
      >
        {secondary}
      </div>
      <Tag
        className={cn(
          'tracking-[-0.01em] text-brand-ink',
          locale === 'am'
            ? 'font-ethiopic font-semibold'
            : 'font-display font-medium',
          locale === 'am' && size === 'sm' ? 'text-[20px]' : s.title,
          // after the size class: tailwind-merge drops leading-* that comes before text-[size]
          'leading-[1.05]',
        )}
      >
        {primary}
      </Tag>
    </div>
  );
}
