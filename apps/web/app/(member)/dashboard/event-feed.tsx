'use client';

import { useState } from 'react';
import { CalendarCheck, Clock } from 'lucide-react';

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  department_id: number | null;
}

interface DeptRow {
  id: number;
  name_am: string;
}

interface EventFeedProps {
  upcoming: EventRow[];
  past: EventRow[];
  departments: DeptRow[];
}

// Stable color assignment for department dots — cycles through brand palette.
const DOT_PALETTE = ['#D4A843', '#8B2F3F', '#4F7B3E', '#A47A18', '#C97B1A', '#6B1D2A'];
function dotFor(deptId: number) {
  return DOT_PALETTE[deptId % DOT_PALETTE.length];
}

function formatDate(d: string): string {
  try {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return d;
  }
}

export function EventFeed({ upcoming, past, departments }: EventFeedProps) {
  const [filterDept, setFilterDept] = useState<number | null>(null);

  const filteredUpcoming = filterDept
    ? upcoming.filter((e) => e.department_id === filterDept)
    : upcoming;
  const filteredPast = filterDept
    ? past.filter((e) => e.department_id === filterDept)
    : past;

  const hasAny = upcoming.length > 0 || past.length > 0;
  if (!hasAny) return null;

  function getDeptName(id: number | null): string | null {
    if (!id) return null;
    return departments.find((d) => d.id === id)?.name_am ?? null;
  }

  return (
    <section className="mt-[22px]">
      <div className="mb-2.5">
        <div className="font-ethiopic text-[11px] font-medium tracking-[0.08em] text-gold-deep dark:text-gold">
          ተከታታይ መርሃ ግብሮች
        </div>
        <h2 className="font-display text-[22px] font-medium leading-[1.05] tracking-tight text-burgundy-ink dark:text-cream">
          Upcoming events
        </h2>
      </div>

      {/* Department filter pills */}
      <div className="mb-3.5 flex gap-1.5 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => setFilterDept(null)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-[11.5px] transition-colors ${
            filterDept === null
              ? 'border-transparent bg-burgundy font-semibold text-cream'
              : 'border border-border bg-card font-medium text-foreground hover:bg-card/80'
          }`}
        >
          All
        </button>
        {departments.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setFilterDept(filterDept === d.id ? null : d.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 font-ethiopic text-[11.5px] transition-colors ${
              filterDept === d.id
                ? 'border-transparent bg-burgundy font-semibold text-cream'
                : 'border border-border bg-card font-medium text-foreground hover:bg-card/80'
            } flex items-center gap-1.5`}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: dotFor(d.id) }}
            />
            {d.name_am}
          </button>
        ))}
      </div>

      {/* Upcoming events */}
      {filteredUpcoming.length > 0 && (
        <div className="space-y-2">
          {filteredUpcoming.map((event) => {
            const deptName = getDeptName(event.department_id);
            return (
              <article
                key={event.id}
                className="gold-accent-l rounded-[14px] border border-border bg-card px-3.5 py-3.5 pl-[18px]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {deptName && (
                      <span className="mb-1 inline-block rounded font-ethiopic text-[10px] font-medium tracking-wider text-gold-deep dark:text-gold"
                        style={{ background: 'rgba(212,168,67,0.12)', padding: '2px 7px' }}
                      >
                        {deptName}
                      </span>
                    )}
                    <h4 className="font-display text-[17px] font-medium leading-tight text-burgundy-ink dark:text-cream">
                      {event.title}
                    </h4>
                    {event.description && (
                      <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-display text-lg font-medium leading-none text-burgundy dark:text-gold-light">
                      {formatDate(event.event_date)}
                    </div>
                    {event.start_time && (
                      <div className="mt-0.5 flex items-center justify-end gap-0.5 font-mono text-[10px] text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" />
                        {event.start_time.slice(0, 5)}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Past events */}
      {filteredPast.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 font-ethiopic text-[11px] font-medium tracking-[0.08em] text-gold-deep dark:text-gold">
            ቅርብ ጊዜ
          </div>
          <h3 className="mb-2.5 font-display text-base font-medium text-muted-foreground">
            Recent
          </h3>
          <div className="space-y-1.5">
            {filteredPast.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-3 py-2.5 opacity-75"
              >
                <CalendarCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">
                    {event.title}
                  </p>
                  <p className="text-[10.5px] text-muted-foreground">
                    {formatDate(event.event_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredUpcoming.length === 0 && filteredPast.length === 0 && hasAny && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No events for this department
        </p>
      )}
    </section>
  );
}
