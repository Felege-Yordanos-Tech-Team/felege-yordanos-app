'use client';

import { useState } from 'react';
import { CalendarCheck, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
      {/* Department filter */}
      {(upcoming.length > 0 || past.length > 0) && (
        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          <Badge
            variant={filterDept === null ? 'default' : 'outline'}
            className="cursor-pointer shrink-0"
            onClick={() => setFilterDept(null)}
          >
            All
          </Badge>
          {departments.map((d) => (
            <Badge
              key={d.id}
              variant={filterDept === d.id ? 'default' : 'outline'}
              className="cursor-pointer shrink-0"
              onClick={() => setFilterDept(filterDept === d.id ? null : d.id)}
            >
              {d.name_am}
            </Badge>
          ))}
        </div>
      )}

      {/* Upcoming Events */}
      {filteredUpcoming.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Upcoming Events</h2>
          <div className="mt-2 space-y-2">
            {filteredUpcoming.map((event) => {
              const deptName = getDeptName(event.department_id);
              return (
                <Card key={event.id}>
                  <CardContent className="py-3">
                    <div className="flex items-start gap-4">
                      <CalendarCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{event.title}</p>
                        {event.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {event.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">{event.event_date}</span>
                          {event.start_time && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {event.start_time.slice(0, 5)}
                              {event.end_time && ` – ${event.end_time.slice(0, 5)}`}
                            </span>
                          )}
                          {deptName && (
                            <Badge variant="secondary" className="text-xs">
                              {deptName}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Events */}
      {filteredPast.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Recent Events</h2>
          <div className="mt-2 space-y-2">
            {filteredPast.map((event) => {
              const deptName = getDeptName(event.department_id);
              return (
                <Card key={event.id} className="opacity-75">
                  <CardContent className="flex items-center gap-4 py-3">
                    <CalendarCheck className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{event.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{event.event_date}</span>
                        {deptName && (
                          <Badge variant="secondary" className="text-xs">
                            {deptName}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">Past</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {filteredUpcoming.length === 0 && filteredPast.length === 0 && (upcoming.length > 0 || past.length > 0) && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          No events for this department
        </p>
      )}
    </>
  );
}
