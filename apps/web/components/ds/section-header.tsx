'use client';

import { useLocale } from '@/lib/i18n/client';
import { bilingual } from '@/lib/i18n/translate';
import { cn } from '@/lib/utils';

// Amharic (Noto Sans Ethiopic) and English (Inter) sizes. Inter is larger
// than Ge'ez at the same px, so its title and eyebrow are a step smaller.
const SIZES = {
  sm: {
    eyebrow: { am: 'text-[11px]', en: 'text-[10px]' },
    title: { am: 'text-[20px]', en: 'text-[19px] tracking-[-0.01em]' },
  },
  md: {
    eyebrow: { am: 'text-xs', en: 'text-[11px]' },
    title: { am: 'text-[28px]', en: 'text-[24px] tracking-[-0.02em]' },
  },
  lg: {
    eyebrow: { am: 'text-[13px]', en: 'text-[11.5px]' },
    title: { am: 'text-[36px]', en: 'text-[31px] tracking-[-0.02em]' },
  },
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
          // The eyebrow is in the other language.
          locale === 'am' ? s.eyebrow.en : s.eyebrow.am,
        )}
      >
        {secondary}
      </div>
      <Tag
        className={cn(
          'tracking-[-0.01em] text-brand-ink',
          locale === 'am'
            ? 'font-ethiopic font-semibold'
            : 'font-display font-semibold',
          locale === 'am' ? s.title.am : s.title.en,
          // after the size class: tailwind-merge drops leading-* that comes before text-[size]
          'leading-[1.05]',
        )}
      >
        {primary}
      </Tag>
    </div>
  );
}
