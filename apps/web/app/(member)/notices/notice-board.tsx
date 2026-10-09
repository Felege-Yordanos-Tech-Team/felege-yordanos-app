'use client';

import { useMemo, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { Card, Chip, Eyebrow } from '@/components/ds';
import {
  NoticeCard,
  useNoticeDepartment,
} from '@/components/notices/notice-card';
import { useLocale, useT } from '@/lib/i18n/client';
import type { NoticeView } from '@/lib/notices';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'everyone' | number;

/**
 * The board: department filter, the first pinned notice as the featured
 * card, then the latest notices (pinned first, newest first).
 */
export function NoticeBoard({ notices }: { notices: NoticeView[] }) {
  const t = useT();
  const locale = useLocale();
  const department = useNoticeDepartment();
  const [filter, setFilter] = useState<Filter>('all');

  // Filter chips: "Everyone" and every department that has a notice.
  const chips = useMemo(() => {
    const seen = new Map<number, NoticeView>();
    let everyone = false;
    for (const n of notices) {
      if (n.departmentId === null) everyone = true;
      else if (!seen.has(n.departmentId)) seen.set(n.departmentId, n);
    }
    return { everyone, departments: [...seen.entries()] };
  }, [notices]);

  const shown = notices.filter((n) =>
    filter === 'all'
      ? true
      : filter === 'everyone'
        ? n.departmentId === null
        : n.departmentId === filter,
  );
  const featured = shown.find((n) => n.pinned && !n.expired) ?? null;
  const rest = shown.filter((n) => n !== featured);

  if (notices.length === 0) return <EmptyBoard />;

  return (
    <div>
      {(chips.departments.length > 0 || chips.everyone) && (
        <div className="-mx-[22px] mb-4 flex gap-1.5 overflow-x-auto px-[22px] pb-1 md:mx-0 md:flex-wrap md:px-0">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
            {t('All')}
          </Chip>
          {chips.everyone && (
            <Chip
              active={filter === 'everyone'}
              onClick={() => setFilter('everyone')}
              amharic={locale === 'am'}
            >
              {t('Everyone')}
            </Chip>
          )}
          {chips.departments.map(([id, n]) => (
            <Chip
              key={id}
              active={filter === id}
              onClick={() => setFilter(id)}
              amharic={locale === 'am'}
            >
              {department(n)}
            </Chip>
          ))}
        </div>
      )}

      {featured && <NoticeCard notice={featured} featured className="mb-5" />}

      {rest.length > 0 && (
        <>
          <Eyebrow className="mb-2.5">{t('Latest')}</Eyebrow>
          <div className="grid items-start gap-3.5 md:grid-cols-2">
            {rest.map((n) => (
              <NoticeCard key={n.id} notice={n} />
            ))}
          </div>
        </>
      )}

      {shown.length === 0 && (
        <p className="py-10 text-center text-[12.5px] text-ink-muted">
          {t('No notices for this department.')}
        </p>
      )}
    </div>
  );
}

function EmptyBoard() {
  const t = useT();
  const locale = useLocale();
  return (
    <Card className="relative flex flex-col items-center overflow-hidden px-6 py-16 text-center md:py-20">
      <div
        className="tibeb-gold pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
      />
      <div className="relative mb-4 rounded-full border border-gold/30 bg-gold/10 p-3.5 text-gold-deep">
        <Megaphone className="h-6 w-6" />
      </div>
      <p
        className={cn(
          'relative leading-tight text-brand-ink',
          locale === 'am'
            ? 'font-ethiopic text-[19px] font-semibold'
            : 'font-display text-[22px] font-medium',
        )}
      >
        {t('No notices yet')}
      </p>
      <p className="relative mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-ink-muted">
        {t(
          'Announcements from the parish council and departments will appear here.',
        )}
      </p>
    </Card>
  );
}
