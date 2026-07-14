'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Check, ChevronsUpDown, Search } from 'lucide-react';
import { formatShortDate } from '@/lib/format';

export interface PickerEvent {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
}

interface CheckInEventPickerProps {
  events: PickerEvent[];
  selectedId: string | null;
  todayEvents: PickerEvent[];
}

const fmtTime = (t: string | null) => (t ? t.slice(0, 5) : '');

/**
 * Searchable event selector for the Check-in surface. "Today" chips cover the
 * common door case; the combobox searches every event. Selecting an event
 * drives the ?event=<id> URL param, so the page server-fetches its attendance.
 */
export function CheckInEventPicker({
  events,
  selectedId,
  todayEvents,
}: CheckInEventPickerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = events.find((e) => e.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.event_date.includes(q) ||
        formatShortDate(e.event_date).toLowerCase().includes(q),
    );
  }, [events, query]);

  function pick(id: string) {
    setOpen(false);
    setQuery('');
    router.push(`/admin/check-in?event=${id}`);
  }

  return (
    <div className="space-y-3">
      {/* Today quick-picks */}
      {todayEvents.length > 0 && (
        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
            Today
          </div>
          <div className="flex flex-wrap gap-1.5">
            {todayEvents.map((e) => {
              const active = e.id === selectedId;
              return (
                <button
                  key={e.id}
                  onClick={() => pick(e.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-burgundy bg-burgundy text-cream dark:border-gold dark:bg-gold dark:text-burgundy-ink'
                      : 'border-border bg-card text-foreground hover:bg-card/70'
                  }`}
                >
                  {e.title}
                  {e.start_time && (
                    <span
                      className={`font-mono text-[10px] ${
                        active ? 'opacity-80' : 'text-muted-foreground'
                      }`}
                    >
                      {fmtTime(e.start_time)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Searchable select */}
      <div>
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
          Event
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-card/70"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-gold-deep dark:text-gold" />
              {selected ? (
                <span className="flex min-w-0 items-baseline gap-1.5">
                  <span className="truncate font-medium text-foreground">
                    {selected.title}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {formatShortDate(selected.event_date)}
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">Select an event…</span>
              )}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-ink-faint" />
          </button>

          {open && (
            <>
              {/* click-away backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setOpen(false)}
                aria-hidden
              />
              <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-fy-lg">
                <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                  <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search events…"
                    className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-ink-faint"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {filtered.length === 0 ? (
                    <div className="px-3.5 py-6 text-center text-xs text-muted-foreground">
                      No events found
                    </div>
                  ) : (
                    filtered.map((e) => {
                      const active = e.id === selectedId;
                      return (
                        <button
                          key={e.id}
                          onClick={() => pick(e.id)}
                          className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left transition-colors hover:bg-gold/[0.08]"
                        >
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate text-[13px] font-medium text-foreground">
                              {e.title}
                            </span>
                            <span className="font-mono text-[10.5px] text-muted-foreground">
                              {formatShortDate(e.event_date)}
                              {e.start_time ? ` · ${fmtTime(e.start_time)}` : ''}
                            </span>
                          </span>
                          {active && (
                            <Check className="h-4 w-4 shrink-0 text-gold-deep dark:text-gold" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
