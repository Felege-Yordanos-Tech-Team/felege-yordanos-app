import Link from 'next/link';
import { ArrowRight, Link2 } from 'lucide-react';
import { getLocale, getT } from '@/lib/i18n/server';
import { cn } from '@/lib/utils';

/** Shown to users without a linked member record: links to /claim. */
export async function LinkProfilePrompt({
  className,
  pending = false,
}: {
  className?: string;
  /** An open link request is waiting for an admin. */
  pending?: boolean;
}) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return (
    <section
      className={cn(
        'gold-accent-l flex items-center gap-3.5 rounded-2xl border border-parchment-edge bg-parchment-soft py-3.5 pl-5 pr-4 shadow-[0_1px_0_rgba(10,60,54,0.04),0_4px_14px_-8px_rgba(10,60,54,0.12)] dark:shadow-[0_4px_14px_-8px_rgba(0,0,0,0.4)]',
        className,
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/[0.16] dark:bg-gold/[0.14]">
        <Link2
          className="h-[18px] w-[18px] text-gold-deep"
          strokeWidth={1.75}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'leading-tight text-brand-ink',
            locale === 'am'
              ? 'font-ethiopic text-sm font-semibold'
              : 'font-display text-[17px] font-medium md:text-lg',
          )}
        >
          {pending ? t('Waiting for approval') : t('Link your member profile')}
        </p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-ink-muted">
          {pending
            ? t('An admin will confirm your member link soon.')
            : t('Required for events and donations')}
        </p>
      </div>
      <Link
        href="/claim"
        className="sacred-gradient inline-flex shrink-0 items-center gap-1.5 rounded-[10px] border border-gold/40 px-3.5 py-2 text-xs font-semibold tracking-[0.04em] text-cream shadow-[0_6px_16px_-6px_rgba(10,60,54,0.4),inset_0_1px_0_rgba(212,168,67,0.25)] transition-opacity hover:opacity-95"
      >
        {pending ? t('View') : t('Link')}
        <ArrowRight className="h-3 w-3 text-gold" />
      </Link>
    </section>
  );
}
