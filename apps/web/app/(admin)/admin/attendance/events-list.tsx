'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Database, UserRole, Department } from '@felege-yordanos/db';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Church,
  List,
  Pencil,
  Plus,
  Repeat,
  Users,
} from 'lucide-react';
import { formatShortDate } from '@/lib/format';
import { deptColor, RECURRENCE_LABELS, todayYmd, type Recurrence } from '@/lib/events';
import { EventFormDialog } from './event-form-dialog';
import { EventsCalendar } from './events-calendar';

type EventRow = Database['public']['Tables']['events']['Row'];

interface EventsListProps {
  events: EventRow[];
  departments: Department[];
  attendanceCounts: Record<string, number>;
  attendedIds: string[];
  userRole: UserRole;
  userDeptId: number | null;
  userId: string;
}

type View = 'list' | 'calendar';
type DialogState = { mode: 'create' | 'edit'; event: EventRow | null; date?: string };

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function splitDate(d: string): { day: string; month: string } {
  const date = new Date(d);
  return {
    day: String(date.getUTCDate()).padStart(2, '0'),
    month: MONTH_SHORT[date.getUTCMonth()] ?? '',
  };
}

function ViewToggle({
  view,
  onChange,
  full = false,
}: {
  view: View;
  onChange: (v: View) => void;
  full?: boolean;
}) {
  return (
    <div
      className={`items-center rounded-lg border border-border bg-card p-0.5 ${
        full ? 'flex w-full' : 'inline-flex'
      }`}
    >
      {(['list', 'calendar'] as View[]).map((v) => {
        const active = view === v;
        const Icon = v === 'list' ? List : CalendarDays;
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
              full ? 'flex-1' : ''
            } ${
              active
                ? 'bg-burgundy text-cream shadow-sm dark:bg-gold dark:text-burgundy-ink'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {v}
          </button>
        );
      })}
    </div>
  );
}

function RecurBadge({ recurrence }: { recurrence: string | null }) {
  if (!recurrence) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-gold-deep dark:text-gold">
      <Repeat className="h-2.5 w-2.5" />
      {RECURRENCE_LABELS[recurrence as Recurrence] ?? 'Repeats'}
    </span>
  );
}

export function EventsList({
  events,
  departments,
  attendanceCounts,
  attendedIds,
  userRole,
  userDeptId,
  userId,
}: EventsListProps) {
  const router = useRouter();
  const [view, setView] = useState<View>('list');
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const today = todayYmd();
  const attendedSet = useMemo(() => new Set(attendedIds), [attendedIds]);

  const upcoming = events.filter((e) => e.event_date >= today);
  const past = events.filter((e) => e.event_date < today);

  const seriesEvents = useMemo(() => {
    const g = dialog?.event?.recurrence_group;
    if (!g) return dialog?.event ? [dialog.event] : [];
    return events.filter((e) => e.recurrence_group === g);
  }, [dialog, events]);

  function deptName(id: number | null): string {
    if (!id) return 'General';
    return departments.find((d) => d.id === id)?.name_am ?? 'Unknown';
  }
  const fmtTime = (t: string | null) => (t ? t.slice(0, 5) : '—');

  const openCreate = (date?: string) => setDialog({ mode: 'create', event: null, date });
  const openEdit = (event: EventRow) => setDialog({ mode: 'edit', event });

  const titleBlock = (
    <div>
      <div className="font-ethiopic text-xs font-medium tracking-[0.06em] text-gold-deep dark:text-gold">
        የስብሰባ ክትትል
      </div>
      <h1 className="mt-0.5 font-display text-[28px] font-medium leading-[1.05] text-burgundy-ink dark:text-cream md:text-[34px]">
        Events &amp; attendance
      </h1>
      <p className="mt-1 text-xs text-muted-foreground md:text-sm">
        Create events and manage attendance records
      </p>
    </div>
  );

  const newEventBtn = (
    <button
      onClick={() => openCreate()}
      className="sacred-gradient inline-flex items-center gap-1.5 rounded-xl border border-gold/40 px-4 py-2 text-xs font-semibold text-cream shadow-fy-md hover:opacity-95 md:text-sm"
    >
      <Plus className="h-4 w-4 text-gold" />
      <span className="max-md:hidden">New event</span>
      <span className="md:hidden">Event</span>
    </button>
  );

  return (
    <>
      {/* ───────────── MOBILE frame ───────────── */}
      <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4 md:hidden">
        <Link
          href="/admin"
          className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep transition-colors hover:text-burgundy dark:text-gold dark:hover:text-gold-light"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Admin panel
        </Link>

        <div className="flex items-start justify-between gap-3">
          {titleBlock}
          {newEventBtn}
        </div>

        <div className="mt-3">
          <ViewToggle view={view} onChange={setView} full />
        </div>

        {/* Ornament rule */}
        <div className="my-4 flex items-center gap-2.5">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-parchment-edge dark:to-ink-muted/40" />
          <span className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-gold opacity-40" />
            <span className="h-1 w-1 rounded-full bg-gold" />
            <span className="h-1 w-1 rounded-full bg-gold opacity-40" />
          </span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-parchment-edge dark:to-ink-muted/40" />
        </div>

        {view === 'list' &&
          (events.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No events yet. Create one to get started.
            </p>
          ) : (
            <>
              {upcoming.length > 0 && (
                <>
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep dark:text-gold">
                    Upcoming
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {upcoming.map((event) => {
                      const { day, month } = splitDate(event.event_date);
                      return (
                        <div
                          key={event.id}
                          className="relative flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3 pl-[18px]"
                          style={{ borderLeftColor: deptColor(event.department_id), borderLeftWidth: 3 }}
                        >
                          <div className="w-11 shrink-0 border-r border-border pr-2.5 text-center">
                            <div className="font-display text-lg font-medium leading-none tabular-nums text-burgundy dark:text-gold-light">
                              {day}
                            </div>
                            <div className="mt-0.5 text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground">
                              {month}
                            </div>
                          </div>
                          <Link href={`/admin/attendance/${event.id}`} className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate font-display text-[17px] font-medium leading-tight text-burgundy-ink dark:text-cream">
                                {event.title}
                              </span>
                              <RecurBadge recurrence={event.recurrence} />
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span className="font-ethiopic text-[10px] text-gold-deep dark:text-gold">
                                {deptName(event.department_id)}
                              </span>
                              {event.start_time && (
                                <>
                                  <span className="h-0.5 w-0.5 rounded-full bg-ink-faint" />
                                  <span className="font-mono text-[10px] text-muted-foreground">
                                    {fmtTime(event.start_time)}
                                  </span>
                                </>
                              )}
                            </div>
                          </Link>
                          <button
                            type="button"
                            onClick={() => openEdit(event)}
                            className="rounded-md p-1 text-muted-foreground hover:bg-card hover:text-foreground"
                            aria-label="Edit event"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <Link
                            href={`/admin/attendance/${event.id}`}
                            className="text-ink-faint"
                            aria-label="Open event"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {past.length > 0 && (
                <>
                  <div className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep dark:text-gold">
                    Past
                  </div>
                  <div className="overflow-hidden rounded-xl border border-border bg-card">
                    {past.map((event, i) => (
                      <Link
                        key={event.id}
                        href={`/admin/attendance/${event.id}`}
                        className={`flex items-center gap-2.5 px-3.5 py-3 hover:bg-card/80 ${
                          i < past.length - 1 ? 'border-b border-border' : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-display text-[15px] font-medium leading-tight text-burgundy-ink dark:text-cream">
                              {event.title}
                            </span>
                            <RecurBadge recurrence={event.recurrence} />
                          </div>
                          <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                            {event.event_date}
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-md bg-gold/[0.14] px-2 py-1">
                          <Users className="h-2.5 w-2.5 text-gold-deep dark:text-gold" />
                          <span className="font-mono text-[11px] font-semibold text-gold-deep dark:text-gold">
                            {attendanceCounts[event.id] ?? 0}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </>
          ))}
      </div>

      {/* ───────────── DESKTOP frame ───────────── */}
      <div className="hidden md:block">
        <div className="px-7 py-7">
          <div className="flex items-end justify-between">
            {titleBlock}
            <div className="flex items-center gap-3">
              <ViewToggle view={view} onChange={setView} />
              {newEventBtn}
            </div>
          </div>

          {view === 'list' && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { am: 'ሳምንታዊ ትምህርት', en: 'Weekly Lesson', Icon: BookOpen, recur: 'Weekly' },
                { am: 'ወርሃዊ ስብሰባ', en: 'Monthly Meeting', Icon: Users, recur: 'Monthly' },
                { am: 'የሰንበት አገልግሎት', en: 'Sunday Service', Icon: Church, recur: 'Weekly' },
              ].map((t) => (
                <button
                  key={t.en}
                  type="button"
                  onClick={() => openCreate()}
                  className="flex items-center gap-3 rounded-[14px] border-[1.5px] border-dashed border-parchment-edge bg-card px-3.5 py-3 text-left transition-colors hover:bg-card/70 dark:border-ink-muted/40"
                >
                  <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-burgundy/[0.08] dark:bg-gold/[0.12]">
                    <t.Icon className="h-4 w-4 text-burgundy dark:text-gold" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold text-burgundy-ink dark:text-cream">{t.en}</div>
                    <div className="font-ethiopic text-[10.5px] text-gold-deep dark:text-gold">{t.am}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold/[0.14] px-2 py-[3px] text-[9.5px] font-semibold text-gold-deep dark:text-gold">
                    <Repeat className="h-[9px] w-[9px]" />
                    {t.recur}
                  </span>
                </button>
              ))}
            </div>
          )}

          {view === 'list' && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-fy-sm">
              {events.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  No events yet. Create one to get started.
                </p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Event
                      </th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Department
                      </th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Date
                      </th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Time
                      </th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Attendance
                      </th>
                      <th className="w-16 px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {[...upcoming, ...past].map((event, i, arr) => {
                      const isUpcoming = event.event_date >= today;
                      return (
                        <tr
                          key={event.id}
                          onClick={() => router.push(`/admin/attendance/${event.id}`)}
                          className={`group cursor-pointer transition-colors hover:bg-parchment/40 dark:hover:bg-card/60 ${
                            i < arr.length - 1 ? 'border-b border-border/60' : ''
                          }`}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-6 w-1 shrink-0 rounded-full"
                                style={{ background: deptColor(event.department_id) }}
                              />
                              <span className="font-display text-[15px] font-medium text-burgundy-ink dark:text-cream">
                                {event.title}
                              </span>
                              <RecurBadge recurrence={event.recurrence} />
                            </div>
                          </td>
                          <td className="px-3 py-3.5 font-ethiopic text-[13px] text-muted-foreground">
                            {deptName(event.department_id)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 font-mono text-[13px] text-foreground">
                            {formatShortDate(event.event_date)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 font-mono text-[13px] text-muted-foreground">
                            {fmtTime(event.start_time)}
                          </td>
                          <td className="px-3 py-3.5">
                            {isUpcoming ? (
                              <span className="inline-flex items-center gap-1.5 text-[12px] text-gold-deep dark:text-gold">
                                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                                upcoming
                              </span>
                            ) : (
                              <span className="text-[13px] text-foreground">
                                <span className="font-mono font-semibold text-status-present">
                                  {attendanceCounts[event.id] ?? 0}
                                </span>{' '}
                                <span className="text-muted-foreground">present</span>
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3.5">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(event);
                                }}
                                className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground group-hover:opacity-100"
                                aria-label="Edit event"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <ChevronRight className="h-4 w-4 text-ink-faint" />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ───────────── CALENDAR (self-responsive) ───────────── */}
      {view === 'calendar' && (
        <div className="mx-auto w-full px-[22px] pb-8 md:max-w-[1180px] md:px-8 md:pb-10">
          <EventsCalendar events={events} onSelectEvent={openEdit} onCreateAt={openCreate} />
        </div>
      )}

      {/* ───────────── Create / Edit dialog ───────────── */}
      <EventFormDialog
        open={!!dialog}
        onOpenChange={(o) => !o && setDialog(null)}
        mode={dialog?.mode ?? 'create'}
        event={dialog?.event ?? null}
        defaultDate={dialog?.date ?? null}
        departments={departments}
        userRole={userRole}
        userDeptId={userDeptId}
        userId={userId}
        seriesEvents={seriesEvents}
        attendedIds={attendedSet}
      />
    </>
  );
}
