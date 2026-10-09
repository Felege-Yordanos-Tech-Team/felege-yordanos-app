import Link from 'next/link';
import { ArrowRight, Megaphone, Pin } from 'lucide-react';
import { Card, SectionHeader } from '@/components/ds';
import { hasEthiopic } from '@/lib/category-color';
import { intlLocale } from '@/lib/i18n/config';
import { getLocale, getT } from '@/lib/i18n/server';
import type { NoticeView } from '@/lib/notices';
import { cn } from '@/lib/utils';

/** Latest active notices (pinned first), linking to the board. */
export async function NoticesCard({
  notices,
  className,
}: {
  notices: NoticeView[];
  className?: string;
}) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const date = new Intl.DateTimeFormat(intlLocale(locale), {
    day: 'numeric',
    month: 'short',
    timeZone: 'Africa/Addis_Ababa',
  });

  return (
    <Card className={className}>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <SectionHeader en="Notices" am="ማስታወቂያዎች" />
        <Link
          href="/notices"
          className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-gold-deep hover:underline"
        >
          {t('Notice board')}
          <ArrowRight className="h-[11px] w-[11px]" />
        </Link>
      </div>

      {notices.length === 0 ? (
        <div className="flex items-center gap-2.5 py-4 text-[12.5px] text-ink-muted">
          <Megaphone className="h-4 w-4 shrink-0 text-gold-deep" />
          {t('No notices yet')}
        </div>
      ) : (
        <ul>
          {notices.map((n, i) => (
            <li
              key={n.id}
              className={i > 0 ? 'border-t border-parchment-edge' : undefined}
            >
              <Link
                href="/notices"
                className="-mx-1.5 block rounded-lg px-1.5 py-2.5 transition-colors hover:bg-gold/[0.06]"
              >
                <span className="flex items-center gap-1.5 text-[10.5px] text-ink-muted">
                  {!n.read && (
                    <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-gold" aria-label={t('Unread')} />
                  )}
                  {n.pinned && <Pin className="h-[10px] w-[10px] text-gold-deep" />}
                  <span className={cn('truncate', locale === 'am' && 'font-ethiopic')}>
                    {n.departmentNameEn
                      ? locale === 'en'
                        ? n.departmentNameEn
                        : (n.departmentNameAm ?? n.departmentNameEn)
                      : t('Everyone')}
                  </span>
                  <span aria-hidden>·</span>
                  <span className="shrink-0 font-mono">
                    {date.format(new Date(n.createdAt))}
                  </span>
                </span>
                <span
                  className={cn(
                    'mt-0.5 block truncate text-brand-ink',
                    hasEthiopic(n.title)
                      ? 'font-ethiopic text-[13px] font-semibold'
                      : 'font-display text-[15px] font-medium',
                  )}
                >
                  {n.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
