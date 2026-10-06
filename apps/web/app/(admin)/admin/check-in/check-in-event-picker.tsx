'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Check, ChevronsUpDown, Search } from 'lucide-react';
import { useLocale, useT } from '@/lib/i18n/client';
import { formatYmd, hhmm } from '@/lib/events';
import { cn } from '@/lib/utils';

export interface PickerEvent {
  id: string;
  title: string;
  eventDate: string;
  startTime: string | null;
}

interface CheckInEventPickerProps {
  events: PickerEvent[];
  selectedId: string | null;
  todayEvents: PickerEvent[];
}

/**
 * Searchable event selector for the Check-in surface. Today's events are
 * listed first; the search covers every event. Selecting an event drives the
 * ?event=<id> URL param, so the page server-fetches its attendance.
 */
export function CheckInEventPicker({
  events,
  selectedId,
  todayEvents,
}: CheckInEventPickerProps) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = events.find((e) => e.id === selectedId) ?? null;
  const todayIds = useMemo(
    () => new Set(todayEvents.map((e) => e.id)),
    [todayEvents],
  );
  const fmt = (ymd: string) => formatYmd(ymd, locale);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.eventDate.includes(q) ||
        formatYmd(e.eventDate, locale).toLowerCase().includes(q),
    );
  }, [events, query, locale]);
  const todayList = filtered.filter((e) => todayIds.has(e.id));
  const otherList = filtered.filter((e) => !todayIds.has(e.id));

  function pick(id: string) {
    setOpen(false);
    setQuery('');
    router.push(`/admin/check-in?event=${id}`);
  }

  const option = (e: PickerEvent) => {
    const active = e.id === selectedId;
    return (
      <button
        key={e.id}
        type="button"
        onClick={() => pick(e.id)}
        className={cn(
          'flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left transition-colors hover:bg-gold/[0.08]',
          active && 'bg-gold/[0.06]',
        )}
      >
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[13px] font-medium text-ink">
            {e.title}
          </span>
          <span className="font-mono text-[10.5px] text-ink-muted">
            {fmt(e.eventDate)}
            {e.startTime ? ` · ${hhmm(e.startTime)}` : ''}
          </span>
        </span>
        {active && <Check className="h-4 w-4 shrink-0 text-gold-deep" />}
      </button>
    );
  };

  const groupLabel = (label: string) => (
    <div className="px-3.5 pb-1 pt-2 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
      {label}
    </div>
  );

  return (
    <div className="relative w-full md:w-[300px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center justify-between gap-2 rounded-[10px] border border-parchment-edge bg-parchment-soft px-3.5 py-[9px] text-left text-[12.5px] transition-colors hover:bg-parchment-deep"
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays className="h-[13px] w-[13px] shrink-0 text-gold-deep" />
          {selected ? (
            <span className="flex min-w-0 items-baseline gap-1.5">
              <span className="truncate font-semibold text-ink">
                {selected.title}
              </span>
              <span className="shrink-0 font-mono text-[10.5px] text-ink-muted">
                {fmt(selected.eventDate)}
              </span>
            </span>
          ) : (
            <span className="text-ink-muted">{t('Select an event…')}</span>
          )}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
      </button>

      {open && (
        <>
          {/* click-away backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-parchment-edge bg-parchment-soft shadow-[0_16px_40px_-16px_rgba(10,60,54,0.35)] md:w-[340px]">
            <div className="flex items-center gap-2 border-b border-parchment-edge px-3 py-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('Search events…')}
                aria-label={t('Search events…')}
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
              />
            </div>
            <div className="max-h-72 overflow-y-auto pb-1">
              {filtered.length === 0 ? (
                <div className="px-3.5 py-6 text-center text-xs text-ink-muted">
                  {t('No events found')}
                </div>
              ) : (
                <>
                  {todayList.length > 0 && (
                    <>
                      {groupLabel(t('Today'))}
                      {todayList.map(option)}
                    </>
                  )}
                  {otherList.length > 0 && (
                    <>
                      {todayList.length > 0 && groupLabel(t('All events'))}
                      {otherList.map(option)}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
