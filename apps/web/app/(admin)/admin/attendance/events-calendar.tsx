'use client';

import { useMemo, useState } from 'react';
import type { Database } from '@felege-yordanos/db';
import { ChevronLeft, ChevronRight, Plus, Repeat } from 'lucide-react';
import {
  MONTH_AM,
  deptColor,
  deptShortLabel,
  monthGrid,
  parseYmd,
  todayYmd,
} from '@/lib/events';

type EventRow = Database['public']['Tables']['events']['Row'];

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface EventsCalendarProps {
  events: EventRow[];
  onSelectEvent: (event: EventRow) => void;
  onCreateAt: (date: string) => void;
}

function timeLabel(t: string | null): string {
  return t ? t.slice(0, 5) : '';
}

export function EventsCalendar({ events, onSelectEvent, onCreateAt }: EventsCalendarProps) {
  const today = todayYmd();
  const initial = parseYmd(today);
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth());
  const [selected, setSelected] = useState<string>(today);

  // date -> events on that date (sorted by start time)
  const byDate = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const e of events) {
      const arr = map.get(e.event_date) ?? [];
      arr.push(e);
      map.set(e.event_date, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''));
    }
    return map;
  }, [events]);

  const weeks = useMemo(() => monthGrid(year, month), [year, month]);

  // Departments appearing this month → legend
  const legend = useMemo(() => {
    const ids = new Set<number | null>();
    for (const [date, evs] of byDate) {
      const d = parseYmd(date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        for (const e of evs) ids.add(e.department_id);
      }
    }
    return [...ids];
  }, [byDate, year, month]);

  function goPrev() {
    const m = month - 1;
    if (m < 0) {
      setMonth(11);
      setYear(year - 1);
    } else setMonth(m);
  }
  function goNext() {
    const m = month + 1;
    if (m > 11) {
      setMonth(0);
      setYear(year + 1);
    } else setMonth(m);
  }
  function goToday() {
    const t = parseYmd(today);
    setYear(t.getFullYear());
    setMonth(t.getMonth());
    setSelected(today);
  }

  const selectedEvents = byDate.get(selected) ?? [];

  const monthTitle = (
    <div className="flex items-baseline gap-2">
      <span className="font-display text-2xl font-medium text-burgundy-ink dark:text-cream md:text-3xl">
        {MONTHS[month]} {year}
      </span>
      <span className="font-ethiopic text-xs text-gold-deep dark:text-gold">
        {MONTH_AM[month]}
      </span>
    </div>
  );

  return (
    <>
      {/* ───────────── MOBILE ───────────── */}
      <div className="md:hidden">
        <div className="mb-3 flex items-center gap-2">
          <button
            onClick={goPrev}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToday}
            className="flex flex-1 flex-col items-center leading-tight"
            aria-label="Jump to today"
          >
            <span className="font-display text-xl font-medium text-burgundy-ink dark:text-cream">
              {MONTHS[month]} {year}
            </span>
            <span className="font-ethiopic text-[10px] text-gold-deep dark:text-gold">
              {MONTH_AM[month]}
            </span>
          </button>
          <button
            onClick={goNext}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Bordered month grid */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="grid grid-cols-7 border-b border-border/60">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="py-1.5 text-center text-[9px] font-semibold tracking-[0.06em] text-muted-foreground"
              >
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {weeks.flat().map((date, i) => {
              const col = i % 7;
              if (!date) {
                return (
                  <div
                    key={i}
                    className={`min-h-[62px] border-b border-border/60 ${
                      col < 6 ? 'border-r' : ''
                    }`}
                  />
                );
              }
              const evs = byDate.get(date) ?? [];
              const isToday = date === today;
              const isSelected = date === selected;
              const dayNum = parseYmd(date).getDate();
              const hasRecur = evs.some((e) => e.recurrence_group);
              return (
                <button
                  key={i}
                  onClick={() => setSelected(date)}
                  className={`min-h-[62px] border-b border-border/60 p-1 text-left transition-colors ${
                    col < 6 ? 'border-r' : ''
                  } ${isSelected ? 'bg-gold/[0.12]' : isToday ? 'bg-gold/[0.04]' : ''}`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] tabular-nums ${
                      isToday
                        ? 'bg-burgundy font-semibold text-cream dark:bg-gold dark:text-burgundy-ink'
                        : 'text-foreground'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {evs.length > 0 && (
                    <span className="mt-1 flex items-center gap-0.5 pl-0.5">
                      {evs.slice(0, 3).map((e) => (
                        <span
                          key={e.id}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: deptColor(e.department_id) }}
                        />
                      ))}
                      {hasRecur && (
                        <Repeat className="h-2.5 w-2.5 text-gold-deep dark:text-gold" />
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected-day detail card */}
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <div>
              <div className="font-display text-lg font-medium text-burgundy-ink dark:text-cream">
                {parseYmd(selected).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {selectedEvents.length === 0
                  ? 'No events'
                  : `${selectedEvents.length} event${selectedEvents.length > 1 ? 's' : ''}`}
              </div>
            </div>
            <button
              onClick={() => onCreateAt(selected)}
              className="flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-gold-deep dark:text-gold"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>
          <div className="space-y-1.5">
            {selectedEvents.map((e) => (
              <button
                key={e.id}
                onClick={() => onSelectEvent(e)}
                className="flex w-full items-center gap-2.5 rounded-xl border border-border bg-background px-3 py-2.5 text-left"
                style={{ borderLeftColor: deptColor(e.department_id), borderLeftWidth: 3 }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-display text-[15px] font-medium text-burgundy-ink dark:text-cream">
                      {e.title}
                    </span>
                    {e.recurrence_group && (
                      <Repeat className="h-3 w-3 shrink-0 text-gold-deep dark:text-gold" />
                    )}
                  </div>
                  {(e.start_time || e.end_time) && (
                    <div className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">
                      {timeLabel(e.start_time)}
                      {e.end_time ? ` – ${timeLabel(e.end_time)}` : ''}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Department legend */}
        {legend.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1">
            {legend.map((id) => (
              <span key={id ?? 'general'} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: deptColor(id) }}
                />
                <span className="text-[11px] text-muted-foreground">
                  {deptShortLabel(id)}
                </span>
              </span>
            ))}
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Repeat className="h-3 w-3 text-gold-deep dark:text-gold" /> recurring
            </span>
          </div>
        )}
      </div>

      {/* ───────────── DESKTOP ───────────── */}
      <div className="hidden md:block">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-fy-sm">
          <div className="mb-4 flex items-center justify-between">
            {monthTitle}
            <div className="flex items-center gap-1.5">
              <button
                onClick={goPrev}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-card"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={goToday}
                className="rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-card"
              >
                Today
              </button>
              <button
                onClick={goNext}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-card"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 border-b border-border">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="pb-2 text-center text-[10px] font-semibold tracking-[0.1em] text-muted-foreground"
              >
                {w}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="grid grid-cols-7">
            {weeks.flat().map((date, i) => {
              if (!date) {
                return (
                  <div
                    key={i}
                    className="min-h-[104px] border-b border-r border-border/60 bg-parchment/30 last:border-r-0 dark:bg-transparent"
                  />
                );
              }
              const evs = byDate.get(date) ?? [];
              const isToday = date === today;
              const dayNum = parseYmd(date).getDate();
              const col = i % 7;
              return (
                <div
                  key={i}
                  className={`group relative min-h-[104px] border-b border-border/60 p-1.5 ${
                    col < 6 ? 'border-r' : ''
                  } ${isToday ? 'bg-gold/[0.05]' : ''}`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums ${
                        isToday
                          ? 'bg-burgundy font-semibold text-cream dark:bg-gold dark:text-burgundy-ink'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {dayNum}
                    </span>
                    <button
                      onClick={() => onCreateAt(date)}
                      className="flex h-5 w-5 items-center justify-center rounded-md text-ink-faint opacity-0 transition-opacity hover:bg-card hover:text-gold-deep group-hover:opacity-100"
                      aria-label={`Add event on ${date}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {evs.slice(0, 3).map((e) => (
                      <button
                        key={e.id}
                        onClick={() => onSelectEvent(e)}
                        className="block w-full rounded-[5px] bg-background px-1.5 py-1 text-left transition-colors hover:brightness-95"
                        style={{
                          borderLeft: `3px solid ${deptColor(e.department_id)}`,
                        }}
                      >
                        <div className="flex items-center gap-1">
                          {e.recurrence_group && (
                            <Repeat className="h-2.5 w-2.5 shrink-0 text-gold-deep dark:text-gold" />
                          )}
                          <span className="truncate text-[11px] font-medium leading-tight text-burgundy-ink dark:text-cream">
                            {e.title}
                          </span>
                        </div>
                        {e.start_time && (
                          <div className="font-mono text-[9px] text-muted-foreground">
                            {timeLabel(e.start_time)}
                          </div>
                        )}
                      </button>
                    ))}
                    {evs.length > 3 && (
                      <div className="pl-1 text-[10px] font-medium text-muted-foreground">
                        +{evs.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          {legend.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {legend.map((id) => (
                <span key={id ?? 'general'} className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: deptColor(id) }}
                  />
                  <span className="text-[11px] text-muted-foreground">
                    {deptShortLabel(id)}
                  </span>
                </span>
              ))}
              <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
                <Repeat className="h-3 w-3 text-gold-deep dark:text-gold" /> recurring
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
