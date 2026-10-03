'use client';

import { useMemo, useState } from 'react';
import { CalendarCheck, Clock } from 'lucide-react';
import { Chip, SectionHeader } from '@/components/ds';
import { useLocale, useT } from '@/lib/i18n/client';
import { cn } from '@/lib/utils';
import { hasEthiopic, shortDate } from './format';

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  departmentId: number | null;
}

interface DeptRow {
  id: number;
  /** Department name in the current language. */
  name: string;
}

interface EventFeedProps {
  upcoming: EventRow[];
  past: EventRow[];
  departments: DeptRow[];
  /** `mobile`: stacked cards (phone). `desktop`: divided rows inside a card. */
  variant: 'mobile' | 'desktop';
}

// Department dot colors, as theme tokens.
const DOTS = [
  'rgb(var(--fy-gold))',
  'rgb(var(--fy-brand-soft))',
  'rgb(var(--fy-present))',
  'rgb(var(--fy-gold-deep))',
  'rgb(var(--fy-late))',
  'rgb(var(--fy-brand))',
];
const dotFor = (deptId: number) => DOTS[deptId % DOTS.length];

/** Event / department text: Ethiopic font for Ge'ez, display serif otherwise. */
function TitleText({ text, className }: { text: string; className?: string }) {
  const am = hasEthiopic(text);
  return (
    <h4
      className={cn(
        'leading-[1.15] text-brand-ink',
        am
          ? 'font-ethiopic text-[15px] font-semibold'
          : 'font-display text-[17px] font-medium',
        className,
      )}
    >
      {text}
    </h4>
  );
}

function DeptTag({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block shrink-0 rounded bg-gold/[0.12] px-[7px] py-0.5 text-[10px] font-medium tracking-[0.04em] text-gold-deep dark:bg-gold/[0.16]',
        hasEthiopic(name) ? 'font-ethiopic' : 'font-body',
        className,
      )}
    >
      {name}
    </span>
  );
}

export function EventFeed({
  upcoming,
  past,
  departments,
  variant,
}: EventFeedProps) {
  const t = useT();
  const locale = useLocale();
  const [filterDept, setFilterDept] = useState<number | null>(null);

  // Only offer filters for departments that have events in the feed.
  const filterDepts = useMemo(() => {
    const used = new Set([...upcoming, ...past].map((e) => e.departmentId));
    return departments.filter((d) => used.has(d.id));
  }, [upcoming, past, departments]);

  const filteredUpcoming = filterDept
    ? upcoming.filter((e) => e.departmentId === filterDept)
    : upcoming;
  const filteredPast = filterDept
    ? past.filter((e) => e.departmentId === filterDept)
    : past;
  const hasAny = upcoming.length > 0 || past.length > 0;

  const deptName = (id: number | null) =>
    id ? (departments.find((d) => d.id === id)?.name ?? null) : null;

  const chips = filterDepts.length > 0 && (
    <div
      className={cn(
        'flex gap-1.5',
        variant === 'mobile'
          ? '-mx-[18px] overflow-x-auto px-[18px] pb-0.5'
          : 'flex-wrap justify-end',
      )}
    >
      <Chip
        active={filterDept === null}
        onClick={() => setFilterDept(null)}
        amharic={locale === 'am'}
        className={variant === 'mobile' ? 'py-1.5 text-[11.5px]' : undefined}
      >
        {t('All')}
      </Chip>
      {filterDepts.map((d) => (
        <Chip
          key={d.id}
          active={filterDept === d.id}
          onClick={() => setFilterDept(filterDept === d.id ? null : d.id)}
          dot={dotFor(d.id)}
          amharic={hasEthiopic(d.name)}
          className={variant === 'mobile' ? 'py-1.5 text-[11.5px]' : undefined}
        >
          {d.name}
        </Chip>
      ))}
    </div>
  );

  const time = (e: EventRow) => e.startTime?.slice(0, 5) ?? null;

  const empty = (text: string) => (
    <p className="py-8 text-center text-[12.5px] text-ink-muted">{text}</p>
  );

  const pastList = filteredPast.length > 0 && (
    <div
      className={
        variant === 'mobile'
          ? 'mt-5'
          : 'mt-4 border-t border-parchment-edge pt-4'
      }
    >
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep">
        {t('Recent')}
      </div>
      <div className="space-y-1.5">
        {filteredPast.map((event) => (
          <div
            key={event.id}
            className="flex items-center gap-3 rounded-xl border border-parchment-edge/70 bg-parchment-soft/60 px-3 py-2.5"
          >
            <CalendarCheck
              className="h-3.5 w-3.5 shrink-0 text-ink-faint"
              strokeWidth={1.75}
            />
            <p
              className={cn(
                'min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink-muted',
                hasEthiopic(event.title) && 'font-ethiopic',
              )}
            >
              {event.title}
            </p>
            <span className="shrink-0 font-mono text-[10.5px] text-ink-faint">
              {shortDate(event.eventDate, locale)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  if (variant === 'desktop') {
    return (
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <SectionHeader en="Upcoming events" am="ተከታታይ መርሃ ግብሮች" />
          {chips}
        </div>

        {!hasAny && empty(t('No upcoming events'))}

        {filteredUpcoming.map((event, i) => {
          const dept = deptName(event.departmentId);
          return (
            <div
              key={event.id}
              className={cn(
                'flex items-center justify-between gap-3.5 py-3.5 pl-4 pr-1',
                i > 0 && 'border-t border-parchment-edge',
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="mb-[3px] flex min-w-0 items-center gap-2">
                  {dept && <DeptTag name={dept} />}
                  <TitleText text={event.title} className="truncate" />
                </div>
                {event.description && (
                  <p className="truncate text-[11.5px] text-ink-muted">
                    {event.description}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <div className="font-display text-[17px] font-medium leading-none text-brand dark:text-gold-light">
                  {shortDate(event.eventDate, locale)}
                </div>
                {time(event) && (
                  <div className="mt-[3px] font-mono text-[10px] text-ink-muted">
                    {time(event)}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {hasAny &&
          filteredUpcoming.length === 0 &&
          filteredPast.length === 0 &&
          empty(t('No events for this department'))}
        {hasAny &&
          filteredUpcoming.length === 0 &&
          filteredPast.length > 0 &&
          empty(t('No upcoming events'))}
        {pastList}
      </section>
    );
  }

  return (
    <section className="mt-[22px]">
      <SectionHeader en="Upcoming events" am="ተከታታይ መርሃ ግብሮች" />
      {chips && <div className="mb-3.5 mt-2.5">{chips}</div>}
      {!chips && <div className="mb-3.5" />}

      {!hasAny && empty(t('No upcoming events'))}

      <div className="space-y-2">
        {filteredUpcoming.map((event) => {
          const dept = deptName(event.departmentId);
          return (
            <article
              key={event.id}
              className="rounded-[14px] border border-parchment-edge bg-parchment-soft py-3.5 pl-[18px] pr-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {dept && <DeptTag name={dept} className="mb-[5px]" />}
                  <TitleText text={event.title} />
                  {event.description && (
                    <p className="mt-0.5 truncate text-[11.5px] text-ink-muted">
                      {event.description}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-display text-lg font-medium leading-none text-brand dark:text-gold-light">
                    {shortDate(event.eventDate, locale)}
                  </div>
                  {time(event) && (
                    <div className="mt-[3px] flex items-center justify-end gap-[3px] font-mono text-[10px] text-ink-muted">
                      <Clock className="h-[9px] w-[9px]" />
                      {time(event)}
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {hasAny &&
        filteredUpcoming.length === 0 &&
        filteredPast.length === 0 &&
        empty(t('No events for this department'))}
      {hasAny &&
        filteredUpcoming.length === 0 &&
        filteredPast.length > 0 &&
        empty(t('No upcoming events'))}
      {pastList}
    </section>
  );
}
