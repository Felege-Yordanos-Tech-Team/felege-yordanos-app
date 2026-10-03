'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Repeat } from 'lucide-react';
import { useLocale, useT } from '@/lib/i18n/client';
import {
  ETH_MONTHS,
  MONTH_AM,
  WEEKDAY_AM,
  geez,
  parseYmd,
  toEthiopic,
  toYmd,
  todayYmd,
} from '@/lib/events';
import { cn } from '@/lib/utils';

/**
 * FY calendar. Day / 5 day / Week / Month
 * views, Google-Calendar style. Below `md` it switches to the compact layout
 * (stacked toolbar, dot month + agenda for the selected day).
 *
 * Shared by the admin events screen and the member "My events" screen.
 */

export interface CalEvent {
  id: string;
  /** `YYYY-MM-DD` */
  date: string;
  /** `HH:MM` or empty for an untimed event. */
  start: string;
  end: string;
  title: string;
  /** Any CSS colour (hex or `rgb(var(--token))`). */
  color: string;
  /** Small secondary line (department). */
  sub?: string;
  recur?: boolean;
  /** Outline instead of a fill (member: upcoming). */
  hollow?: boolean;
  /** Struck through (member: absent). */
  strike?: boolean;
  /** Already-translated status label shown in the agenda. */
  status?: string;
}

export interface CalLegendItem {
  label: string;
  sub?: string;
  color: string;
  hollow?: boolean;
}

type CalView = 'day' | '5day' | 'week' | 'month';

interface EventsCalendarProps {
  events: CalEvent[];
  legend?: CalLegendItem[];
  legendNote?: React.ReactNode;
  onSelectEvent?: (id: string) => void;
  /** When given, days offer an "add" affordance. */
  onCreateAt?: (date: string) => void;
}

const MONTHS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DOW_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW_LONG_EN = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const DOW_AM1 = ['እ', 'ሰ', 'ማ', 'ረ', 'ሐ', 'ዓ', 'ቅ'];

const START_HOUR = 6;
const END_HOUR = 22;

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const weekStart = (d: Date) => addDays(d, -d.getDay());
const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
const pad = (n: number) => String(n).padStart(2, '0');
const fmtMin = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
const tint = (color: string, pct: number) =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`;

interface Placed extends CalEvent {
  s: number;
  e: number;
  col: number;
  ncol: number;
}

/** Side-by-side layout for overlapping events in one day column. */
function layout(evts: CalEvent[]): Placed[] {
  const items = evts
    .filter((ev) => ev.start)
    .map((ev) => {
      const s = toMin(ev.start);
      let e = ev.end ? toMin(ev.end) : s + 60;
      if (e <= s) e = s + 60;
      return { ...ev, s, e, col: 0, ncol: 1 };
    })
    .sort((a, b) => a.s - b.s || b.e - a.e);
  const out: Placed[] = [];
  let cluster: Placed[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const cols: number[] = [];
    for (const ev of cluster) {
      let i = cols.findIndex((end) => end <= ev.s);
      if (i < 0) {
        i = cols.length;
        cols.push(0);
      }
      cols[i] = ev.e;
      ev.col = i;
    }
    for (const ev of cluster) {
      ev.ncol = cols.length;
      out.push(ev);
    }
    cluster = [];
  };
  for (const ev of items) {
    if (cluster.length && ev.s >= clusterEnd) flush();
    cluster.push(ev);
    clusterEnd = Math.max(clusterEnd, ev.e);
  }
  if (cluster.length) flush();
  return out;
}

/** True below the `md` breakpoint. Only rendered after a user toggles to the calendar. */
function useCompact() {
  const [compact, setCompact] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 767px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const fn = () => setCompact(mq.matches);
    fn();
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return compact;
}

function Dot({
  color,
  hollow,
  size = 7,
}: {
  color: string;
  hollow?: boolean;
  size?: number;
}) {
  return (
    <span
      className="shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: hollow ? 'transparent' : color,
        border: hollow ? `1.5px solid ${color}` : undefined,
      }}
    />
  );
}

export function EventsCalendar({
  events,
  legend = [],
  legendNote,
  onSelectEvent,
  onCreateAt,
}: EventsCalendarProps) {
  const t = useT();
  const locale = useLocale();
  const am = locale === 'am';
  const compact = useCompact();

  const today = todayYmd();
  const [view, setView] = useState<CalView>('month');
  const [cursor, setCursor] = useState(() => parseYmd(today));
  const [sel, setSel] = useState(today);
  const [nowMin, setNowMin] = useState(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      const n = new Date();
      setNowMin(n.getHours() * 60 + n.getMinutes());
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const hourH = compact ? 40 : 48;
  const gutter = compact ? 34 : 56;

  const MONTHS = am ? MONTH_AM : MONTHS_EN;
  const MON = am ? MONTH_AM : MONTHS_EN.map((m) => m.slice(0, 3));
  const DOW = am ? WEEKDAY_AM : DOW_EN;
  const DOWL = am ? WEEKDAY_AM : DOW_LONG_EN;
  const DOW1 = am ? DOW_AM1 : DOW_EN.map((d) => d[0]);
  const DOW2 = am ? DOW_AM1 : DOW_EN.map((d) => d.slice(0, 2));

  const byDate = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const e of events) {
      const list = m.get(e.date) ?? [];
      list.push(e);
      m.set(e.date, list);
    }
    for (const list of m.values()) {
      list.sort((a, b) => (a.start || '99').localeCompare(b.start || '99'));
    }
    return m;
  }, [events]);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = Math.max(0, (7 - START_HOUR) * hourH);
  }, [view, hourH]);

  const gridDays =
    view === 'day'
      ? [cursor]
      : view === '5day'
        ? [1, 2, 3, 4, 5].map((i) => addDays(weekStart(cursor), i))
        : [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(weekStart(cursor), i));

  function step(dir: number) {
    if (view === 'month')
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1));
    else setCursor(addDays(cursor, view === 'day' ? dir : dir * 7));
  }
  function goToday() {
    setCursor(parseYmd(today));
    setSel(today);
  }
  function openDay(d: Date) {
    setCursor(d);
    setSel(toYmd(d));
    setView('day');
  }

  // Title + Ethiopic subtitle
  let title: string;
  let eth: string;
  if (view === 'month') {
    title = `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
    const e = toEthiopic(new Date(cursor.getFullYear(), cursor.getMonth(), 15));
    eth = `${ETH_MONTHS[e.month - 1]} ${geez(e.year)}`;
  } else if (view === 'day') {
    title = compact
      ? `${DOW[cursor.getDay()]}, ${MON[cursor.getMonth()]} ${cursor.getDate()}`
      : `${DOWL[cursor.getDay()]}, ${MONTHS[cursor.getMonth()]} ${cursor.getDate()}, ${cursor.getFullYear()}`;
    const e = toEthiopic(cursor);
    eth = `${ETH_MONTHS[e.month - 1]} ${geez(e.day)} ${geez(e.year)}`;
  } else {
    const a = gridDays[0];
    const b = gridDays[gridDays.length - 1];
    title =
      a.getMonth() === b.getMonth()
        ? `${MON[a.getMonth()]} ${a.getDate()} – ${b.getDate()}, ${b.getFullYear()}`
        : `${MON[a.getMonth()]} ${a.getDate()} – ${MON[b.getMonth()]} ${b.getDate()}, ${b.getFullYear()}`;
    const e = toEthiopic(a);
    eth = `${ETH_MONTHS[e.month - 1]} ${geez(e.year)}`;
  }

  const eventsLabel = (n: number) =>
    n === 0 ? t('No events') : n === 1 ? t('1 event') : t('{n} events', { n });

  // ── Toolbar ──
  const todayBtn = (
    <button
      type="button"
      onClick={goToday}
      className={cn(
        'shrink-0 rounded-lg border border-parchment-edge-strong font-semibold text-ink transition-colors hover:bg-parchment-deep',
        compact ? 'h-[30px] px-3 text-[11.5px]' : 'h-8 px-4 text-xs',
      )}
    >
      {t('Today')}
    </button>
  );
  const arrowCls = cn(
    'flex shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-parchment-deep',
    compact ? 'h-[30px] w-[30px]' : 'h-8 w-8',
  );
  const arrows = (
    <div className="flex items-center">
      <button
        type="button"
        className={arrowCls}
        onClick={() => step(-1)}
        aria-label={t('Previous')}
      >
        <ChevronLeft className="h-[17px] w-[17px]" />
      </button>
      <button
        type="button"
        className={arrowCls}
        onClick={() => step(1)}
        aria-label={t('Next')}
      >
        <ChevronRight className="h-[17px] w-[17px]" />
      </button>
    </div>
  );
  const titleBlock = (
    <div
      className={cn(
        'flex min-w-0',
        compact ? 'flex-col items-start gap-px' : 'items-baseline gap-2.5',
      )}
    >
      <div
        className={cn(
          'whitespace-nowrap leading-[1.05] text-brand-ink',
          am ? 'font-ethiopic font-semibold' : 'font-display font-semibold',
          compact
            ? 'max-w-full truncate text-[18px]'
            : am
              ? 'text-[19px]'
              : 'text-[22px]',
        )}
      >
        {title}
      </div>
      <div
        className={cn(
          'whitespace-nowrap font-ethiopic text-gold-deep',
          compact ? 'text-[10.5px]' : 'text-xs',
        )}
      >
        {eth}
      </div>
    </div>
  );
  const VIEWS: { key: CalView; label: string }[] = [
    { key: 'day', label: t('Day') },
    { key: '5day', label: t('5 day') },
    { key: 'week', label: t('Week') },
    { key: 'month', label: t('Month') },
  ];
  const switcher = (
    <div
      className={cn(
        'flex gap-0.5 rounded-[10px] border border-parchment-edge bg-parchment p-[3px] dark:bg-parchment-deep',
        compact && 'w-full',
      )}
    >
      {VIEWS.map((v) => {
        const active = view === v.key;
        return (
          <button
            key={v.key}
            type="button"
            onClick={() => setView(v.key)}
            className={cn(
              'whitespace-nowrap rounded-[7px] font-semibold transition-colors',
              compact
                ? 'flex-1 py-1.5 text-[11px]'
                : 'px-3 py-1.5 text-[11.5px]',
              active ? 'bg-brand text-cream' : 'text-ink-muted hover:text-ink',
            )}
          >
            {v.label}
          </button>
        );
      })}
    </div>
  );
  const toolbar = compact ? (
    <div className="flex flex-col gap-2.5 px-3 pb-2.5 pt-3">
      {switcher}
      <div className="flex items-center gap-1">
        {arrows}
        <div className="min-w-0 flex-1 pl-0.5">{titleBlock}</div>
        {todayBtn}
      </div>
    </div>
  ) : (
    <div className="flex flex-wrap items-center gap-1.5 px-[18px] py-3.5">
      {todayBtn}
      {arrows}
      <div className="ml-1.5 shrink-0">{titleBlock}</div>
      <div className="flex-1" />
      {switcher}
    </div>
  );

  // ── Time grid (day / 5 day / week) ──
  function timeGrid() {
    const n = gridDays.length;
    const cols = `${gutter}px repeat(${n}, minmax(0, 1fr))`;
    const hours: number[] = [];
    for (let h = START_HOUR; h < END_HOUR; h += 1) hours.push(h);
    const gridH = (END_HOUR - START_HOUR) * hourH;
    const lines = `repeating-linear-gradient(to bottom, rgb(var(--fy-edge)) 0, rgb(var(--fy-edge)) 1px, transparent 1px, transparent ${hourH}px)`;
    const untimed = gridDays.map((d) =>
      (byDate.get(toYmd(d)) ?? []).filter((e) => !e.start),
    );
    const hasUntimed = untimed.some((l) => l.length > 0);
    return (
      <div>
        {/* Day headers */}
        <div
          className="grid border-y border-parchment-edge"
          style={{ gridTemplateColumns: cols }}
        >
          <div />
          {gridDays.map((d) => {
            const key = toYmd(d);
            const isToday = key === today;
            return (
              <button
                key={key}
                type="button"
                disabled={view === 'day'}
                onClick={() => openDay(d)}
                className={cn(
                  'min-w-0 border-l border-parchment-edge text-center',
                  compact ? 'py-1.5' : 'py-2',
                )}
              >
                <div
                  className={cn(
                    'font-semibold uppercase tracking-[0.08em]',
                    compact ? 'text-[9px]' : 'text-[10.5px]',
                    isToday ? 'text-brand' : 'text-ink-muted',
                  )}
                >
                  {compact && n === 7 ? DOW1[d.getDay()] : DOW[d.getDay()]}
                </div>
                <div
                  className={cn(
                    'mx-auto mt-[3px] flex items-center justify-center rounded-full tabular-nums',
                    compact
                      ? 'h-[26px] w-[26px] text-[13px]'
                      : 'h-[34px] w-[34px] text-[18px]',
                    isToday
                      ? 'bg-brand font-bold text-cream'
                      : 'font-medium text-ink',
                  )}
                >
                  {d.getDate()}
                </div>
              </button>
            );
          })}
        </div>

        {/* Untimed events */}
        {hasUntimed && (
          <div
            className="grid border-b border-parchment-edge"
            style={{ gridTemplateColumns: cols }}
          >
            <div className="self-center pr-1 text-right text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
              {t('All day')}
            </div>
            {untimed.map((list, i) => (
              <div
                key={i}
                className="flex min-w-0 flex-col gap-0.5 border-l border-parchment-edge p-0.5"
              >
                {list.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => onSelectEvent?.(ev.id)}
                    disabled={!onSelectEvent}
                    className="truncate rounded-md px-1.5 py-0.5 text-left text-[10.5px] font-semibold text-ink"
                    style={{
                      background: ev.hollow ? undefined : tint(ev.color, 20),
                      border: `1px solid ${tint(ev.color, 45)}`,
                    }}
                  >
                    {ev.title}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Hour grid */}
        <div
          ref={scrollRef}
          className="relative overflow-y-auto"
          style={{ height: compact ? 400 : 540 }}
        >
          <div
            className="relative grid"
            style={{ gridTemplateColumns: cols, height: gridH }}
          >
            <div className="relative">
              {hours.map(
                (h, i) =>
                  i > 0 && (
                    <div
                      key={h}
                      className={cn(
                        'absolute font-mono text-ink-faint',
                        compact
                          ? 'right-1 text-[8.5px]'
                          : 'right-2 text-[10px]',
                      )}
                      style={{ top: i * hourH - 6 }}
                    >
                      {compact ? h : `${pad(h)}:00`}
                    </div>
                  ),
              )}
            </div>
            {gridDays.map((d) => {
              const key = toYmd(d);
              const evs = layout(byDate.get(key) ?? []);
              const isToday = key === today;
              const nowTop = ((nowMin - START_HOUR * 60) / 60) * hourH;
              return (
                <div
                  key={key}
                  className={cn(
                    'relative min-w-0 border-l border-parchment-edge',
                    isToday && 'bg-brand-soft/[0.04] dark:bg-brand-soft/[0.06]',
                  )}
                  style={{ backgroundImage: lines }}
                >
                  {evs.map((ev) => {
                    const s = Math.max(ev.s, START_HOUR * 60);
                    const top = ((s - START_HOUR * 60) / 60) * hourH;
                    const h = Math.max(((ev.e - s) / 60) * hourH - 2, 18);
                    const roomy = h >= 38;
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => onSelectEvent?.(ev.id)}
                        disabled={!onSelectEvent}
                        title={`${fmtMin(ev.s)}–${fmtMin(ev.e)} ${ev.title}${ev.status ? ` · ${ev.status}` : ''}`}
                        className={cn(
                          'absolute z-[1] box-border overflow-hidden rounded-md text-left text-ink',
                          compact ? 'px-1 py-0.5' : 'px-[7px] py-[3px]',
                          ev.strike && 'opacity-60',
                        )}
                        style={{
                          top,
                          height: h,
                          left: `calc(${(ev.col / ev.ncol) * 100}% + 2px)`,
                          width: `calc(${100 / ev.ncol}% - 4px)`,
                          background: ev.hollow
                            ? 'rgb(var(--fy-card))'
                            : tint(ev.color, 20),
                          border: ev.hollow
                            ? `1.5px solid ${ev.color}`
                            : `1px solid ${tint(ev.color, 40)}`,
                        }}
                      >
                        <div
                          className={cn(
                            'flex items-center gap-[3px] overflow-hidden font-semibold leading-[1.25]',
                            compact ? 'text-[10px]' : 'text-[11.5px]',
                            roomy ? 'whitespace-normal' : 'whitespace-nowrap',
                            ev.strike && 'line-through',
                          )}
                        >
                          {ev.recur && (
                            <Repeat
                              className={cn(
                                'shrink-0 text-gold-deep',
                                compact ? 'h-2 w-2' : 'h-2.5 w-2.5',
                              )}
                            />
                          )}
                          <span className="min-w-0 truncate">{ev.title}</span>
                        </div>
                        {roomy && (
                          <div
                            className={cn(
                              'mt-px truncate font-mono text-ink-muted',
                              compact ? 'text-[8.5px]' : 'text-[10px]',
                            )}
                          >
                            {fmtMin(ev.s)}–{fmtMin(ev.e)}
                            {!compact && ev.sub ? (
                              <span className="font-ethiopic"> · {ev.sub}</span>
                            ) : null}
                          </div>
                        )}
                      </button>
                    );
                  })}
                  {isToday &&
                    nowMin > START_HOUR * 60 &&
                    nowMin < END_HOUR * 60 && (
                      <div
                        className="pointer-events-none absolute inset-x-0 z-[2]"
                        style={{ top: nowTop }}
                      >
                        <div className="h-0.5 bg-status-absent" />
                        <span className="absolute -left-[5px] -top-1 h-2.5 w-2.5 rounded-full bg-status-absent" />
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Month grid ──
  function monthGrid() {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = weekStart(first);
    const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i));
    const maxChips = 3;
    return (
      <div>
        <div className="grid grid-cols-7 border-t border-parchment-edge">
          {DOW.map((d, i) => (
            <div
              key={d}
              className={cn(
                'text-center font-semibold uppercase tracking-[0.08em] text-ink-muted',
                compact ? 'py-1.5 text-[9px]' : 'pb-1.5 pt-2 text-[10.5px]',
                i < 6 && 'border-r border-parchment-edge',
              )}
            >
              {compact ? DOW2[i] : d}
            </div>
          ))}
        </div>
        <div
          className="grid grid-cols-7 border-t border-parchment-edge"
          style={{ gridAutoRows: compact ? 46 : 112 }}
        >
          {cells.map((d, i) => {
            const key = toYmd(d);
            const cur = d.getMonth() === cursor.getMonth();
            const evs = byDate.get(key) ?? [];
            const isToday = key === today;
            const isSel = compact && key === sel;
            const label =
              d.getDate() === 1 && !compact
                ? `${MON[d.getMonth()]} 1`
                : d.getDate();
            const cellCls = cn(
              'group relative flex min-w-0 flex-col overflow-hidden',
              compact
                ? 'items-center gap-[3px] px-0.5 py-1'
                : 'items-stretch gap-0.5 px-1 pb-1 pt-1.5',
              i % 7 < 6 && 'border-r border-parchment-edge',
              i < 35 && 'border-b border-parchment-edge',
              isSel
                ? 'bg-brand-soft/[0.09] dark:bg-brand-soft/[0.16]'
                : !cur && 'bg-black/[0.015] dark:bg-black/[0.12]',
            );
            const dayNum = (
              <span
                className={cn(
                  'flex h-6 min-w-6 items-center justify-center whitespace-nowrap rounded-xl px-1 tabular-nums',
                  compact ? 'text-[11px]' : 'text-[11.5px]',
                  isToday
                    ? 'bg-brand font-bold text-cream'
                    : cn('font-medium', cur ? 'text-ink' : 'text-ink-faint'),
                )}
              >
                {label}
              </span>
            );
            if (compact) {
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSel(key)}
                  className={cellCls}
                >
                  {dayNum}
                  <span className="flex h-1.5 gap-0.5">
                    {evs.slice(0, 3).map((ev) => (
                      <Dot
                        key={ev.id}
                        color={ev.color}
                        hollow={ev.hollow}
                        size={6}
                      />
                    ))}
                  </span>
                </button>
              );
            }
            const shown = evs.slice(
              0,
              evs.length > maxChips ? maxChips - 1 : maxChips,
            );
            return (
              <div key={key} className={cellCls}>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => openDay(d)}
                    className="rounded-xl hover:bg-parchment-deep"
                  >
                    {dayNum}
                  </button>
                </div>
                {onCreateAt && (
                  <button
                    type="button"
                    onClick={() => onCreateAt(key)}
                    className="absolute right-1 top-1.5 flex h-5 w-5 items-center justify-center rounded-md text-ink-faint opacity-0 transition-opacity hover:bg-parchment-deep hover:text-gold-deep focus:opacity-100 group-hover:opacity-100"
                    aria-label={t('Add event on {date}', { date: key })}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
                {shown.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => onSelectEvent?.(ev.id)}
                    disabled={!onSelectEvent}
                    title={`${ev.start} ${ev.title}${ev.status ? ` · ${ev.status}` : ''}`}
                    className="flex min-w-0 items-center gap-[5px] rounded-[5px] px-1.5 py-0.5 text-left text-[11px] leading-[1.35] text-ink enabled:hover:bg-parchment-deep"
                  >
                    <Dot color={ev.color} hollow={ev.hollow} />
                    {ev.start && (
                      <span className="shrink-0 font-mono text-[10px] text-ink-muted">
                        {ev.start}
                      </span>
                    )}
                    <span
                      className={cn(
                        'min-w-0 truncate font-semibold',
                        ev.strike && 'line-through opacity-60',
                      )}
                    >
                      {ev.title}
                    </span>
                  </button>
                ))}
                {evs.length > maxChips && (
                  <button
                    type="button"
                    onClick={() => openDay(d)}
                    className="self-start px-1.5 py-px text-[10.5px] font-semibold text-ink-muted hover:text-ink"
                  >
                    {t('+{n} more', { n: evs.length - (maxChips - 1) })}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {compact && agenda()}
      </div>
    );
  }

  // ── Agenda for the selected day (compact month) ──
  function agenda() {
    const d = parseYmd(sel);
    const evs = byDate.get(sel) ?? [];
    return (
      <div className="border-t border-parchment-edge px-3.5 pb-3.5 pt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <div
              className={cn(
                'font-semibold text-brand-ink',
                am ? 'font-ethiopic text-[15px]' : 'font-display text-[17px]',
              )}
            >
              {DOWL[d.getDay()]}, {MON[d.getMonth()]} {d.getDate()}
            </div>
            <span className="font-mono text-[10px] text-ink-muted">
              {eventsLabel(evs.length)}
            </span>
          </div>
          {onCreateAt && (
            <button
              type="button"
              onClick={() => onCreateAt(sel)}
              className="flex items-center gap-1 rounded-lg border border-parchment-edge bg-parchment px-2.5 py-1.5 text-[11px] font-semibold text-gold-deep dark:bg-parchment-deep"
            >
              <Plus className="h-3 w-3" /> {t('Add')}
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          {evs.map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => onSelectEvent?.(ev.id)}
              disabled={!onSelectEvent}
              className="flex items-center gap-2.5 rounded-[10px] px-[11px] py-[9px] text-left"
              style={{
                background: ev.hollow
                  ? 'rgb(var(--fy-page))'
                  : tint(ev.color, 12),
                border: ev.hollow
                  ? `1.5px solid ${ev.color}`
                  : `1px solid ${tint(ev.color, 25)}`,
              }}
            >
              <div className="w-[38px] shrink-0 font-mono text-[10.5px] leading-[1.3] text-ink-muted">
                {ev.start || '—'}
                {ev.end ? (
                  <>
                    <br />
                    {ev.end}
                  </>
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    'flex items-center gap-1 font-display text-[15px] font-semibold leading-[1.15] text-brand-ink',
                    ev.strike && 'line-through',
                  )}
                >
                  {ev.recur && (
                    <Repeat className="h-2.5 w-2.5 shrink-0 text-gold-deep" />
                  )}
                  <span className="truncate">{ev.title}</span>
                </div>
                {ev.sub && (
                  <div className="mt-px font-ethiopic text-[10.5px] text-gold-deep">
                    {ev.sub}
                  </div>
                )}
              </div>
              {ev.status && (
                <span
                  className="shrink-0 text-[10px] font-semibold capitalize"
                  style={{ color: ev.color }}
                >
                  {ev.status}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'overflow-hidden border border-parchment-edge bg-parchment-soft',
        compact ? 'rounded-[14px]' : 'rounded-2xl',
      )}
    >
      {toolbar}
      {view === 'month' ? monthGrid() : timeGrid()}
      {(legend.length > 0 || legendNote) && (
        <div
          className={cn(
            'flex flex-wrap items-center border-t border-parchment-edge',
            compact
              ? 'justify-center gap-x-3 gap-y-1.5 px-3.5 py-2.5'
              : 'gap-4 px-[18px] py-3',
          )}
        >
          {legend.map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <Dot color={l.color} hollow={l.hollow} size={8} />
              {l.sub && (
                <span
                  className={cn(
                    'font-ethiopic text-ink',
                    compact ? 'text-[10.5px]' : 'text-[11px]',
                  )}
                >
                  {l.sub}
                </span>
              )}
              <span
                className={cn(
                  compact ? 'text-[10.5px]' : 'text-[11px]',
                  l.sub ? 'text-ink-faint' : 'text-ink',
                )}
              >
                {l.label}
              </span>
            </div>
          ))}
          {legendNote && (
            <>
              {!compact && <div className="flex-1" />}
              {legendNote}
            </>
          )}
        </div>
      )}
    </div>
  );
}
