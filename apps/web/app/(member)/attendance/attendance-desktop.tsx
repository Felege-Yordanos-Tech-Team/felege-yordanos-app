'use client';

import { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  List as ListIcon,
} from 'lucide-react';
import { MemberQR } from '@/components/member-qr';

export type AttnStatus = 'present' | 'late' | 'absent' | 'upcoming';

export interface AttnRow {
  title: string;
  deptAm: string;
  /** ISO event date (YYYY-MM-DD). */
  date: string;
  dateLabel: string; // "May 24"
  time: string; // "08:30" or ""
  status: AttnStatus;
}

interface AttendanceDesktopViewProps {
  rows: AttnRow[]; // most-recent first
  nextEvent: { title: string; dateLabel: string; time: string } | null;
  memberId: string | null;
  className?: string;
}

const STATUS: Record<AttnStatus, { text: string; bg: string; dot: string }> = {
  present: { text: 'text-status-present', bg: 'bg-status-present-bg', dot: 'bg-status-present' },
  late: { text: 'text-status-late', bg: 'bg-status-late-bg', dot: 'bg-status-late' },
  absent: { text: 'text-status-absent', bg: 'bg-status-absent-bg', dot: 'bg-status-absent' },
  upcoming: { text: 'text-gold-deep dark:text-gold', bg: 'bg-gold/[0.16]', dot: 'bg-gold' },
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const COLS = 'grid-cols-[1.5fr_120px_90px_80px_110px]';

function StatusPill({ status }: { status: AttnStatus }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${s.bg} ${s.text}`}>
      <span className={`h-[5px] w-[5px] rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function AttnCalendar({ rows }: { rows: AttnRow[] }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const byDay = new Map<number, AttnRow>();
  for (const r of rows) {
    const [y, m, d] = r.date.split('-').map(Number);
    if (y === cursor.y && m - 1 === cursor.m) byDay.set(d, r);
  }
  const firstDow = new Date(cursor.y, cursor.m, 1).getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const isThisMonth = cursor.y === now.getFullYear() && cursor.m === now.getMonth();
  const today = now.getDate();

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-fy-sm">
      {/* Month nav */}
      <div className="mb-3.5 flex items-center justify-between">
        <div className="font-display text-[22px] font-medium leading-none text-burgundy-ink dark:text-cream">
          {MONTHS[cursor.m]} {cursor.y}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-card/70"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCursor({ y: now.getFullYear(), m: now.getMonth() })}
            className="rounded-lg border border-border bg-card px-3.5 py-1.5 text-[11.5px] font-semibold text-foreground hover:bg-card/70"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-card/70"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-parchment-edge pb-2 dark:border-ink-muted/40">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gold-deep dark:text-gold">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const e = day ? byDay.get(day) : null;
          const isToday = isThisMonth && day === today;
          return (
            <div
              key={i}
              className={`min-h-[92px] p-[7px] ${(i + 1) % 7 ? 'border-r border-border' : ''} ${
                i < cells.length - 7 ? 'border-b border-border' : ''
              } ${isToday ? 'bg-gold/[0.10]' : ''}`}
            >
              {day && (
                <>
                  <div
                    className={`mb-1 flex h-[22px] w-[22px] items-center justify-center rounded-full font-mono text-[11px] ${
                      isToday ? 'bg-burgundy font-bold text-cream' : 'font-medium text-muted-foreground'
                    }`}
                  >
                    {day}
                  </div>
                  {e && (
                    <div className={`relative overflow-hidden rounded-md px-1.5 py-1 pl-[9px] ${STATUS[e.status].bg}`}>
                      <span className={`absolute inset-y-0.5 left-0 w-[2.5px] rounded ${STATUS[e.status].dot}`} />
                      <div className="truncate text-[9.5px] font-semibold leading-tight text-foreground">{e.title}</div>
                      <div className={`mt-0.5 text-[8.5px] font-semibold uppercase ${STATUS[e.status].text}`}>{e.status}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3.5 flex flex-wrap items-center gap-4">
        {(['present', 'late', 'absent', 'upcoming'] as AttnStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${STATUS[s].dot}`} />
            <span className="text-[11px] capitalize text-foreground">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AttendanceDesktopView({ rows, nextEvent, memberId, className }: AttendanceDesktopViewProps) {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const attended = rows.filter((r) => r.status === 'present' || r.status === 'late').length;
  const pastTotal = rows.filter((r) => r.status !== 'upcoming').length;

  return (
    <div className={className}>
      {/* Page head */}
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="font-ethiopic text-xs text-gold-deep dark:text-gold">ክትትል</div>
          <h1 className="mt-0.5 font-display text-[30px] font-medium leading-[1.05] text-burgundy-ink dark:text-cream">
            My attendance
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">Your check-in record across Sunday School events</p>
        </div>
        {/* Segmented toggle */}
        <div className="flex shrink-0 gap-[3px] rounded-lg border border-border bg-background p-[3px]">
          {([
            { key: 'list', label: 'List', Icon: ListIcon },
            { key: 'calendar', label: 'Calendar', Icon: CalendarIcon },
          ] as const).map((t) => {
            const active = view === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setView(t.key)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${
                  active ? 'bg-burgundy text-cream shadow-sm dark:bg-gold dark:text-burgundy-ink' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <t.Icon className={`h-3 w-3 ${active ? '' : ''}`} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_340px] items-start gap-4">
        {/* Main view */}
        {view === 'list' ? (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-fy-sm">
            <div className="mb-3.5 flex items-center justify-between">
              <div>
                <div className="font-ethiopic text-[11px] font-medium tracking-[0.08em] text-gold-deep dark:text-gold">
                  የክትትል ታሪክ
                </div>
                <h2 className="font-display text-[22px] font-medium leading-none text-burgundy-ink dark:text-cream">Events</h2>
              </div>
              <span className="font-mono text-xs text-gold-deep dark:text-gold">
                {attended} / {pastTotal}{' '}
                <span className="font-body text-[9.5px] text-muted-foreground">attended</span>
              </span>
            </div>

            {rows.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No attendance records yet.</p>
            ) : (
              <>
                {/* header */}
                <div className={`grid ${COLS} gap-3 border-b border-parchment-edge px-1 pb-2.5 dark:border-ink-muted/40`}>
                  {['Event', 'Department', 'Date', 'Time', 'Status'].map((h) => (
                    <span key={h} className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                      {h}
                    </span>
                  ))}
                </div>
                {/* rows */}
                {rows.map((r, i) => (
                  <div key={i} className={`grid ${COLS} items-center gap-3 border-b border-border px-1 py-3`}>
                    <div className="relative pl-3">
                      <span className="absolute inset-y-1 left-0 w-[3px] rounded bg-gradient-to-b from-transparent via-gold to-transparent" />
                      <span className="font-display text-base font-medium text-burgundy-ink dark:text-cream">{r.title}</span>
                    </div>
                    <span className="w-fit rounded bg-gold/[0.12] px-2 py-0.5 font-ethiopic text-[11px] text-gold-deep dark:text-gold">
                      {r.deptAm}
                    </span>
                    <span className="font-mono text-[11px] text-foreground">{r.dateLabel}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{r.time || '—'}</span>
                    <StatusPill status={r.status} />
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          <AttnCalendar rows={rows} />
        )}

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Next event */}
          <div className="sacred-gradient relative overflow-hidden rounded-2xl border border-gold/30 px-5 py-[18px] text-cream shadow-fy-lg">
            <div className="tibeb-gold absolute inset-0 opacity-[0.55]" />
            <div className="relative">
              <div className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-gold-light">Next event</div>
              {nextEvent ? (
                <>
                  <div className="mt-1.5 font-display text-xl font-medium leading-tight text-cream">{nextEvent.title}</div>
                  <div className="mt-1.5 flex items-center gap-2 font-mono text-[11px] text-gold-light">
                    <Clock className="h-3 w-3" />
                    {nextEvent.dateLabel}
                    {nextEvent.time ? ` · ${nextEvent.time}` : ''}
                  </div>
                </>
              ) : (
                <div className="mt-1.5 font-display text-lg italic text-cream/70">No upcoming events</div>
              )}
            </div>
          </div>

          {/* Check-in QR */}
          <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-fy-sm">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep dark:text-gold">Check-in code</div>
            {memberId ? (
              <>
                <div className="mx-auto mt-3 w-fit rounded-xl border border-border bg-parchment-soft p-2.5 shadow-[0_8px_20px_-12px_rgba(74,14,24,0.35)]">
                  <MemberQR value={memberId} size={132} />
                </div>
                <div className="mt-2.5 font-mono text-[12.5px] tracking-[0.08em] text-foreground">{memberId}</div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">Show this code at the door to check in.</p>
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Link your profile to get a check-in code.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
