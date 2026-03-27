'use client';

import { useState } from 'react';
import { CalendarCheck, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

export function EventFeed({ upcoming, past, departments }: EventFeedProps) {
  const [filterDept, setFilterDept] = useState<number | null>(null);

  function getDeptName(id: number | null): string | null {
    if (!id) return null;
    return departments.find((d) => d.id === id)?.name_am ?? null;
  }

  const filteredUpcoming = filterDept
    ? upcoming.filter((e) => e.department_id === filterDept)
    : upcoming;

  const filteredPast = filterDept
    ? past.filter((e) => e.department_id === filterDept)
    : past;

  return (
    <>
      {/* Section header */}
      {(upcoming.length > 0 || past.length > 0) && (
        <div className="mb-4">
          <span className="text-secondary font-label text-[10px] tracking-widest uppercase block mb-1">ተከታታይ መርሃ ግብሮች</span>
          <h3 className="font-headline text-3xl">Upcoming Events</h3>
        </div>
      )}

      {/* Department filter pills */}
      {(upcoming.length > 0 || past.length > 0) && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterDept(null)}
            className={`shrink-0 rounded-full px-5 py-2 text-xs font-label transition-colors ${
              filterDept === null
                ? 'bg-primary-container text-primary-foreground'
                : 'bg-surface-container-high text-foreground hover:bg-surface-container'
            }`}
          >
            All
          </button>
          {departments.map((d) => (
            <button
              key={d.id}
              onClick={() => setFilterDept(filterDept === d.id ? null : d.id)}
              className={`shrink-0 rounded-full px-5 py-2 text-xs font-label transition-colors ${
                filterDept === d.id
                  ? 'bg-primary-container text-primary-foreground'
                  : 'bg-surface-container-high text-foreground hover:bg-surface-container'
              }`}
            >
              {d.name_am}
            </button>
          ))}
        </div>
      )}

      {/* Upcoming Events */}
      {filteredUpcoming.length > 0 && (
        <div className="space-y-4 mb-8">
          {filteredUpcoming.map((event) => {
            const deptName = getDeptName(event.department_id);
            return (
              <div key={event.id} className="group relative bg-surface-container-low rounded-xl overflow-hidden flex transition-all duration-300 hover:-translate-y-0.5">
                <div className="w-1 bg-secondary absolute left-0 h-full" />
                <div className="p-5 pl-6 flex flex-col gap-3 w-full">
                  <div className="flex justify-between items-start">
                    <div>
                      {deptName && (
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2 inline-block font-label">
                          {deptName}
                        </span>
                      )}
                      <h4 className="font-headline text-xl">{event.title}</h4>
                      {event.description && (
                        <p className="text-muted-foreground text-sm mt-1 line-clamp-1">{event.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-headline text-lg leading-none">{event.event_date}</p>
                      {event.start_time && (
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter font-label flex items-center justify-end gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {event.start_time.slice(0, 5)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Past Events */}
      {filteredPast.length > 0 && (
        <div className="mb-8">
          <h3 className="font-headline text-xl mb-4 text-muted-foreground">Recent</h3>
          <div className="space-y-3">
            {filteredPast.map((event) => (
              <div key={event.id} className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low/50 opacity-60">
                <CalendarCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.event_date}</p>
                </div>
                <Badge variant="secondary" className="shrink-0 text-xs">Past</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredUpcoming.length === 0 && filteredPast.length === 0 && (upcoming.length > 0 || past.length > 0) && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No events for this department
        </p>
      )}
    </>
  );
}
