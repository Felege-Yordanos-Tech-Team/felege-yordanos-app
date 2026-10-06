'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setLocale } from '@/lib/i18n/actions';
import { useLocale } from '@/lib/i18n/client';
import { cn } from '@/lib/utils';

/** አማ / EN pill. `onDark` for use on brand-colored surfaces (mobile header). */
export function LangToggle({ onDark = false, className }: { onDark?: boolean; className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();

  function choose(next: 'am' | 'en') {
    if (next === locale || pending) return;
    start(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        'flex shrink-0 gap-0.5 rounded-full border p-0.5',
        onDark ? 'border-gold/25 bg-cream/10' : 'border-parchment-edge',
        pending && 'opacity-70',
        className,
      )}
    >
      {(
        [
          ['am', 'አማ'],
          ['en', 'EN'],
        ] as const
      ).map(([key, label]) => {
        const active = locale === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => choose(key)}
            aria-pressed={active}
            className={cn(
              'h-[26px] min-w-[34px] rounded-full px-2 text-[11px] font-bold transition-colors',
              key === 'am' ? 'font-ethiopic' : 'tracking-[0.06em]',
              active
                ? onDark
                  ? 'bg-gold-light text-brand-deep'
                  : 'bg-brand text-cream'
                : onDark
                  ? 'text-cream/75 hover:text-cream'
                  : 'text-ink-muted hover:text-ink',
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
