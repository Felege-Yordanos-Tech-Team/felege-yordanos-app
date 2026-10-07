'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  List,
  ScanLine,
  Search,
  Zap,
} from 'lucide-react';
import { Card, Eyebrow, PageHead, SectionHeader } from '@/components/ds';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLocale, useT } from '@/lib/i18n/client';
import { formatYmd, hhmm } from '@/lib/events';
import { normalizeMemberId } from '@/lib/member-id';
import { cn } from '@/lib/utils';
import { getEventAttendance, markAttendance } from '../actions';
import {
  BackLink,
  primaryBtn,
  secondaryBtn,
} from '@/components/events/event-ui';
import { QRScanner, type ScanResult } from './qr-scanner';

type AttendanceStatus = 'present' | 'absent' | 'late';

/** The member fields the check-in screens need. */
export interface CheckInMember {
  id: number;
  memberId: string;
  name: string;
  fatherName: string;
}

export interface CheckInAttendance {
  memberId: number;
  status: AttendanceStatus;
}

/** The event being checked in (only display fields). */
export interface CheckInEvent {
  title: string;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  description: string | null;
}

interface CheckInTabsProps {
  eventId: string;
  members: CheckInMember[];
  attendance: CheckInAttendance[];
  event: CheckInEvent;
  /** Phone back link (English label, translated here). */
  back: { href: string; label: string };
  /** Extra header control, e.g. the event picker on the Check-in hub. */
  picker?: React.ReactNode;
  /** Show the CSV export (only when the user may read this event's attendance). */
  canExport?: boolean;
}

interface CheckInLog {
  name: string;
  memberId: string;
  time: string;
  status: AttendanceStatus;
}

const STATUS_DOT: Record<AttendanceStatus, string> = {
  present: 'bg-status-present',
  late: 'bg-status-late',
  absent: 'bg-status-absent',
};

const STATUS_BTN: Record<
  AttendanceStatus,
  { label: 'P' | 'L' | 'A'; name: string; active: string; idle: string }
> = {
  present: {
    label: 'P',
    name: 'Present',
    active:
      'bg-status-present text-cream shadow-[0_2px_8px_-2px_rgb(var(--fy-present)/0.5)]',
    idle: 'border border-parchment-edge bg-parchment-soft text-status-present hover:bg-status-present-bg',
  },
  late: {
    label: 'L',
    name: 'Late',
    active:
      'bg-status-late text-cream shadow-[0_2px_8px_-2px_rgb(var(--fy-late)/0.5)]',
    idle: 'border border-parchment-edge bg-parchment-soft text-status-late hover:bg-status-late-bg',
  },
  absent: {
    label: 'A',
    name: 'Absent',
    active:
      'bg-status-absent text-cream shadow-[0_2px_8px_-2px_rgb(var(--fy-absent)/0.5)]',
    idle: 'border border-parchment-edge bg-parchment-soft text-status-absent hover:bg-status-absent-bg',
  },
};

const STATUSES: AttendanceStatus[] = ['present', 'late', 'absent'];

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

const fullName = (m: CheckInMember) =>
  [m.name, m.fatherName].filter(Boolean).join(' ');

/** Members per page in the desktop member table. */
const PAGE_SIZE = 12;

/** Rows rendered in the phone member list; search finds the rest. */
const MOBILE_LIST_LIMIT = 50;

/** How often the screen fetches check-ins made on other devices. */
const SYNC_INTERVAL_MS = 15_000;

/** Lookup key for a typed or scanned member ID ("42" -> "ssu/01/03/05/00042"). */
const memberKey = (input: string) => normalizeMemberId(input).toLowerCase();

type MobileTab = 'quick' | 'member-list' | 'qr-scan';
type DeskEntry = 'quick' | 'qr' | 'list';

export function CheckInTabs({
  eventId,
  members,
  attendance,
  event,
  back,
  picker,
  canExport = true,
}: CheckInTabsProps) {
  const t = useT();
  const locale = useLocale();
  const [tab, setTab] = useState<MobileTab>('quick');
  const [records, setRecords] = useState<Record<number, AttendanceStatus>>(
    () => {
      const map: Record<number, AttendanceStatus> = {};
      for (const a of attendance) map[a.memberId] = a.status;
      return map;
    },
  );
  const [search, setSearch] = useState('');
  const [quickInput, setQuickInput] = useState('');
  const [checkInLogs, setCheckInLogs] = useState<CheckInLog[]>([]);
  const [page, setPage] = useState(0);
  const [deskEntry, setDeskEntry] = useState<DeskEntry>('quick');
  const quickInputRef = useRef<HTMLInputElement>(null);
  const deskQuickRef = useRef<HTMLInputElement>(null);
  const deskSearchRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Refocus whichever quick-entry input is visible (mobile tab vs desktop rail).
  const focusQuick = useCallback(() => {
    quickInputRef.current?.focus();
    deskQuickRef.current?.focus();
  }, []);

  const membersByMemberId = useMemo(() => {
    const map = new Map<string, CheckInMember>();
    for (const m of members) map.set(m.memberId.toLowerCase(), m);
    return map;
  }, [members]);

  // Latest records for callbacks, and when this device last changed each
  // member (so a sync started earlier never undoes a newer tap).
  const recordsRef = useRef(records);
  useEffect(() => {
    recordsRef.current = records;
  }, [records]);
  const localEdits = useRef(new Map<number, number>());

  // Pull check-ins made on other devices: on open, every SYNC_INTERVAL_MS and
  // when the phone comes back to this tab.
  useEffect(() => {
    if (!canExport) return;
    let stopped = false;
    async function sync() {
      if (document.visibilityState !== 'visible') return;
      const startedAt = Date.now();
      const res = await getEventAttendance(eventId).catch(() => null);
      if (stopped || !res || !res.ok) return;
      setRecords((prev) => {
        const next: Record<number, AttendanceStatus> = {};
        for (const a of res.data) next[a.memberId] = a.status;
        for (const [id, at] of localEdits.current) {
          if (at < startedAt) continue;
          if (prev[id]) next[id] = prev[id];
          else delete next[id];
        }
        return next;
      });
    }
    void sync();
    const timer = setInterval(sync, SYNC_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void sync();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [eventId, canExport]);

  const presentCount = useMemo(
    () =>
      Object.values(records).filter((s) => s === 'present' || s === 'late')
        .length,
    [records],
  );
  const total = members.length;
  const progress = total ? Math.min(100, (presentCount / total) * 100) : 0;

  // Optimistic: the button changes at once; on failure it goes back and a
  // toast explains why.
  const upsertAttendance = useCallback(
    async (memberId: number, status: AttendanceStatus) => {
      const previous = recordsRef.current[memberId];
      localEdits.current.set(memberId, Date.now());
      setRecords((prev) => ({ ...prev, [memberId]: status }));
      const res = await markAttendance({ eventId, memberId, status }).catch(
        () => ({
          ok: false as const,
          error: 'Could not save attendance. Please try again.',
        }),
      );
      if (!res.ok) {
        localEdits.current.set(memberId, Date.now());
        setRecords((prev) => {
          if (prev[memberId] !== status) return prev; // a newer tap won
          const next = { ...prev };
          if (previous) next[memberId] = previous;
          else delete next[memberId];
          return next;
        });
        toast({
          title: t('Error'),
          description: t(res.error),
          variant: 'destructive',
        });
        return false;
      }
      return true;
    },
    [eventId, toast, t],
  );

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.fatherName?.toLowerCase().includes(q) ||
        m.memberId.toLowerCase().includes(q) ||
        fullName(m).toLowerCase().includes(q),
    );
  }, [members, search]);
  const mobileMembers = filteredMembers.slice(0, MOBILE_LIST_LIMIT);

  // Desktop member table pagination.
  const pageCount = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageMembers = filteredMembers.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  async function handleQuickCheckIn(e: React.FormEvent) {
    e.preventDefault();
    const id = quickInput.trim();
    if (!id) return;

    const member = membersByMemberId.get(memberKey(id));
    if (!member) {
      toast({
        title: t('Not found'),
        description: t('Member ID not found'),
        variant: 'destructive',
      });
      setQuickInput('');
      focusQuick();
      return;
    }

    const name = fullName(member);
    if (records[member.id] === 'present' || records[member.id] === 'late') {
      toast({ title: name, description: t('Already checked in') });
      setQuickInput('');
      focusQuick();
      return;
    }

    const ok = await upsertAttendance(member.id, 'present');
    if (ok) {
      toast({ title: name, description: t('Checked in') });
      setCheckInLogs((prev) => [
        {
          name,
          memberId: member.memberId,
          time: formatTime(new Date()),
          status: 'present',
        },
        ...prev.slice(0, 9),
      ]);
    }

    setQuickInput('');
    focusQuick();
  }

  const latest = checkInLogs[0];

  async function handleQRDecoded(decoded: string): Promise<ScanResult> {
    const code = decoded.trim();
    const member = membersByMemberId.get(memberKey(code));
    if (!member) return { kind: 'invalid', code };
    const name = fullName(member);
    if (records[member.id] === 'present' || records[member.id] === 'late') {
      return { kind: 'already', name, memberId: member.memberId };
    }
    const ok = await upsertAttendance(member.id, 'present');
    if (!ok) return { kind: 'invalid', code };
    const time = formatTime(new Date());
    setCheckInLogs((prev) => [
      { name, memberId: member.memberId, time, status: 'present' },
      ...prev.slice(0, 9),
    ]);
    return { kind: 'success', name, memberId: member.memberId, time };
  }

  /** CSV of this event's attendance, built from what is on the page. */
  function exportCsv() {
    const esc = (v: string) =>
      /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    const lines = [['Member ID', 'Name', 'Status'].join(',')];
    for (const m of members)
      lines.push(
        [m.memberId, fullName(m), records[m.id] ?? ''].map(esc).join(','),
      );
    const blob = new Blob(['﻿' + lines.join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${event.eventDate}-${event.title.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'event'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Display bits ──
  const start = hhmm(event.startTime);
  const end = hhmm(event.endTime);
  const timeRange = start && end ? `${start} – ${end}` : start || end;
  const dateShort = formatYmd(event.eventDate, locale);
  const dateLong = formatYmd(event.eventDate, locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const sub = [dateShort, start, event.description].filter(Boolean).join(' · ');
  const lastN = t('last {n}', { n: Math.min(checkInLogs.length, 10) });

  const statusButtons = (m: CheckInMember, size: 'sm' | 'md') => (
    <div className={cn('flex', size === 'sm' ? 'gap-[5px]' : 'gap-1')}>
      {STATUSES.map((status) => {
        const cfg = STATUS_BTN[status];
        const active = records[m.id] === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => upsertAttendance(m.id, status)}
            aria-pressed={active}
            aria-label={t('{status} for {name}', {
              status: t(cfg.name),
              name: m.name,
            })}
            className={cn(
              'flex items-center justify-center font-bold transition-colors',
              size === 'sm'
                ? 'h-7 w-7 rounded-lg text-xs'
                : 'h-8 w-8 rounded-[9px] text-[13px]',
              active ? cfg.active : cfg.idle,
            )}
          >
            {cfg.label}
          </button>
        );
      })}
    </div>
  );

  const searchBox = (
    cls: string,
    ref?: React.Ref<HTMLInputElement>,
    placeholder = t('Name or ID…'),
    soft = false,
  ) => (
    <div className={cn('relative', cls)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-faint" />
      <Input
        ref={ref}
        placeholder={placeholder}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        aria-label={t('Search members')}
        className={cn(
          'h-auto rounded-[10px] border border-parchment-edge pl-8 pr-3 text-[12.5px] text-ink placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-gold/30',
          soft
            ? 'bg-parchment-soft py-[9px]'
            : 'bg-parchment py-[7px] dark:bg-parchment-deep',
        )}
      />
      {search && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] text-ink-muted">
          {filteredMembers.length === 1
            ? t('1 match')
            : t('{n} matches', { n: filteredMembers.length })}
        </span>
      )}
    </div>
  );

  const exportBtn = canExport && (
    <button type="button" onClick={exportCsv} className={secondaryBtn}>
      <Download className="h-[13px] w-[13px]" />
      {t('Export')}
    </button>
  );

  const recentRows = (variant: 'mobile' | 'desktop') =>
    checkInLogs.length === 0 ? (
      <p className="rounded-xl border border-dashed border-parchment-edge py-5 text-center text-xs text-ink-muted">
        {variant === 'mobile'
          ? t('No check-ins yet. Enter a member ID above.')
          : t('No check-ins yet.')}
      </p>
    ) : variant === 'mobile' ? (
      <div className="flex flex-col gap-1">
        {checkInLogs.map((log, i) => (
          <div
            key={`${log.memberId}-${i}`}
            className={cn(
              'flex items-center gap-2.5 rounded-[10px] border px-3 py-[9px]',
              i === 0
                ? 'border-parchment-edge bg-parchment-soft'
                : 'border-transparent',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'h-2 w-2 shrink-0 rounded-full',
                STATUS_DOT[log.status],
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[15px] font-medium leading-[1.1] text-brand-ink">
                {log.name}
              </div>
              <div className="mt-px font-mono text-[10px] text-ink-muted">
                {log.memberId}
              </div>
            </div>
            <span className="font-mono text-[10px] tabular-nums text-ink-muted">
              {log.time}
            </span>
          </div>
        ))}
      </div>
    ) : (
      <div>
        {checkInLogs.map((log, i) => (
          <div
            key={`d-${log.memberId}-${i}`}
            className={cn(
              'flex items-center gap-2.5 py-[9px]',
              i > 0 && 'border-t border-parchment-edge',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'h-[7px] w-[7px] shrink-0 rounded-full',
                STATUS_DOT[log.status],
              )}
            />
            <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink">
              {log.name}
            </span>
            <span className="font-mono text-[10px] text-ink-faint">
              {log.memberId}
            </span>
            <span className="font-mono text-[10px] text-gold-deep">
              {log.time}
            </span>
          </div>
        ))}
      </div>
    );

  const mobileTabs: { key: MobileTab; label: string; Icon: typeof Zap }[] = [
    { key: 'quick', label: t('Quick'), Icon: Zap },
    { key: 'member-list', label: t('List'), Icon: List },
    { key: 'qr-scan', label: t('QR'), Icon: ScanLine },
  ];
  const deskTabs: { key: DeskEntry; label: string; Icon: typeof Zap }[] = [
    { key: 'quick', label: t('Quick ID'), Icon: Zap },
    { key: 'qr', label: t('QR scan'), Icon: ScanLine },
    { key: 'list', label: t('List'), Icon: List },
  ];

  return (
    <>
      {/* ─────────────── PHONE (< md) ─────────────── */}
      <div className="px-[18px] pb-6 pt-3 md:hidden">
        <div className="mb-2.5">
          <BackLink href={back.href}>{t(back.label)}</BackLink>
        </div>

        {picker && <div className="mb-4">{picker}</div>}

        <div className="mb-3.5">
          <div
            className={cn(
              'text-[11px] tracking-[0.06em] text-gold-deep',
              locale === 'am' ? 'font-display text-xs' : 'font-ethiopic',
            )}
          >
            {locale === 'am' ? 'Check-in' : 'መግቢያ'}
          </div>
          <h1 className="mt-0.5 font-display text-2xl font-medium leading-[1.1] text-brand-ink">
            {event.title}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-[4px] bg-brand/[0.08] px-2 py-0.5 font-mono text-[10px] font-medium text-brand dark:bg-gold/[0.12] dark:text-gold-light">
              {dateLong}
            </span>
            {timeRange && (
              <span className="rounded-[4px] bg-gold/[0.16] px-2 py-0.5 font-mono text-[10px] font-medium text-gold-deep">
                {timeRange}
              </span>
            )}
            {event.description && (
              <span className="text-[11px] italic text-ink-muted">
                · {event.description}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          className="mb-3.5 flex rounded-xl bg-parchment-deep p-[3px]"
        >
          {mobileTabs.map(({ key, label, Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(key)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-[9px] p-2.5 text-xs transition-colors',
                  active
                    ? 'bg-parchment-soft font-semibold text-brand-ink shadow-[0_1px_2px_rgba(10,60,54,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)]'
                    : 'font-medium text-ink-muted',
                )}
              >
                <Icon
                  className={cn(
                    'h-3.5 w-3.5',
                    active ? 'text-brand dark:text-gold' : 'text-ink-muted',
                  )}
                />
                {label}
              </button>
            );
          })}
        </div>

        {tab === 'quick' && (
          <div role="tabpanel">
            {/* Counter */}
            <section className="sacred-gradient relative mb-3.5 overflow-hidden rounded-[18px] border border-gold/25 px-5 py-[18px] text-cream shadow-[0_12px_28px_-12px_rgba(10,60,54,0.4)]">
              <div className="tibeb-gold absolute inset-0 opacity-40" />
              <div className="relative">
                <div className="flex items-baseline justify-between">
                  <div
                    className={cn(
                      'text-[11px] tracking-[0.06em] text-gold-light',
                      locale === 'am' ? 'font-ethiopic' : 'font-body',
                    )}
                  >
                    {t('Members present')}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-gold-light/70">
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 rounded-full bg-status-present shadow-[0_0_6px_#4F7B3E]"
                    />
                    {t('Live')}
                  </div>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-display text-[64px] font-medium leading-[0.95] tracking-[-0.02em] tabular-nums text-gold">
                    {presentCount}
                  </span>
                  <span className="font-display text-[28px] font-normal tabular-nums text-gold-light/50">
                    / {total}
                  </span>
                  <span className="ml-auto text-[11px] text-cream/60">
                    {t('present')}
                  </span>
                </div>
                <div className="mt-2.5 h-1 overflow-hidden rounded-sm bg-cream/[0.12]">
                  <div
                    className="h-full rounded-sm bg-gradient-to-r from-gold to-gold-light shadow-[0_0_8px_rgba(212,168,67,0.5)] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </section>

            {/* ID input */}
            <form onSubmit={handleQuickCheckIn} className="mb-3.5">
              <div className="flex items-center gap-2.5 rounded-[14px] border-2 border-gold bg-parchment-soft px-4 py-3 shadow-[0_0_0_4px_rgba(212,168,67,0.15),0_4px_16px_-6px_rgba(212,168,67,0.3)]">
                <ScanLine className="h-5 w-5 shrink-0 text-brand dark:text-gold" />
                <Input
                  ref={quickInputRef}
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder={t('Enter member ID…')}
                  aria-label={t('Member ID')}
                  autoFocus
                  className="h-auto border-none bg-transparent p-0 font-mono text-lg font-medium tracking-[0.08em] text-ink shadow-none placeholder:font-body placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-ink-faint focus-visible:ring-0"
                />
                <button
                  type="submit"
                  className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.14em] text-gold-deep"
                >
                  {t('Enter ↵')}
                </button>
              </div>
            </form>

            {/* Last check-in */}
            {latest && (
              <div className="mb-[18px] flex items-center gap-3 rounded-[14px] border border-status-present/30 bg-status-present-bg px-4 py-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-present">
                  <Check
                    className="h-[22px] w-[22px] text-cream"
                    strokeWidth={3}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-lg font-medium leading-[1.1] text-brand-ink">
                    {latest.name}
                  </div>
                  <div className="mt-0.5 text-[11px] font-semibold text-status-present">
                    {t('Checked in')} · {latest.memberId}
                  </div>
                </div>
                <div className="shrink-0 font-mono text-[11px] font-semibold text-status-present">
                  {latest.time}
                </div>
              </div>
            )}

            <div className="mb-2 flex items-baseline justify-between">
              <Eyebrow>{t('Recent')}</Eyebrow>
              {checkInLogs.length > 0 && (
                <span className="font-mono text-[10px] text-ink-muted">
                  {lastN}
                </span>
              )}
            </div>
            {recentRows('mobile')}
          </div>
        )}

        {tab === 'member-list' && (
          <div role="tabpanel">
            <div className="mb-3 flex justify-end">
              <div className="sacred-gradient inline-flex items-baseline gap-1 rounded-full border border-gold/30 px-3 py-1.5 font-mono font-semibold text-gold">
                <span className="text-[13px] tabular-nums">{presentCount}</span>
                <span className="text-[10px] opacity-60">/ {total}</span>
              </div>
            </div>
            {searchBox('mb-3.5', undefined, t('Search members…'), true)}
            {filteredMembers.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-muted">
                {t('No members found')}
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {mobileMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2.5 rounded-[10px] border border-parchment-edge bg-parchment-soft px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold leading-[1.15] text-brand-ink">
                        {fullName(m)}
                      </div>
                      <div className="mt-px font-mono text-[9.5px] text-ink-muted">
                        {m.memberId}
                      </div>
                    </div>
                    {statusButtons(m, 'md')}
                  </div>
                ))}
                {filteredMembers.length > mobileMembers.length && (
                  <p className="py-3 text-center text-xs text-ink-muted">
                    {t('Showing {n} of {total}. Search to find others.', {
                      n: mobileMembers.length,
                      total: filteredMembers.length,
                    })}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'qr-scan' && (
          <div role="tabpanel">
            <QRScanner
              active
              onMemberId={handleQRDecoded}
              presentCount={presentCount}
              total={total}
            />
          </div>
        )}
      </div>

      {/* ─────────────── DESKTOP (md+) ─────────────── */}
      <div className="hidden px-7 py-7 md:block">
        <PageHead
          en={`Check-in — ${event.title}`}
          am="መግቢያ"
          sub={sub}
          actions={
            picker || exportBtn ? (
              <>
                {picker}
                {exportBtn}
              </>
            ) : undefined
          }
        />

        <div className="grid grid-cols-[minmax(0,380px)_minmax(0,1fr)] items-start gap-4">
          {/* Left rail */}
          <div className="flex flex-col gap-4">
            {/* Counter */}
            <section className="sacred-gradient relative overflow-hidden rounded-[18px] border border-gold/30 px-6 py-[22px] shadow-[0_10px_26px_-14px_rgba(10,60,54,0.55)]">
              <div className="tibeb-gold absolute inset-0 opacity-[0.55]" />
              <div className="relative">
                <div className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.2em] text-gold-light">
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full bg-status-present shadow-[0_0_6px_#7BA463]"
                  />
                  {t('Live')} · {t('present')}
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-[58px] font-medium leading-[0.9] tabular-nums text-cream">
                    {presentCount}
                  </span>
                  <span className="font-mono text-[15px] text-gold-light/80">
                    / {total}
                  </span>
                </div>
                <div className="mt-3 h-1 rounded bg-cream/15">
                  <div
                    className="h-full rounded bg-gradient-to-r from-gold-deep to-gold shadow-[0_0_8px_rgba(212,168,67,0.6)] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </section>

            {/* Entry modes */}
            <Card>
              <div
                role="tablist"
                className="mb-3.5 flex gap-1 rounded-[10px] border border-parchment-edge bg-parchment p-[3px] dark:bg-parchment-deep"
              >
                {deskTabs.map(({ key, label, Icon }) => {
                  const active = deskEntry === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setDeskEntry(key);
                        if (key === 'list') deskSearchRef.current?.focus();
                      }}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-[5px] whitespace-nowrap rounded-lg px-1 py-[7px] text-[11px] font-semibold transition-colors',
                        active
                          ? 'bg-brand text-cream shadow-[0_3px_8px_-3px_rgba(10,60,54,0.5)]'
                          : 'text-ink-muted hover:text-ink',
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-[11px] w-[11px]',
                          active ? 'text-gold' : 'text-ink-muted',
                        )}
                      />
                      {label}
                    </button>
                  );
                })}
              </div>

              {deskEntry === 'quick' && (
                <form onSubmit={handleQuickCheckIn}>
                  <Input
                    ref={deskQuickRef}
                    value={quickInput}
                    onChange={(e) => setQuickInput(e.target.value)}
                    placeholder={t('Member number or ID')}
                    aria-label={t('Member ID')}
                    className="h-auto rounded-xl border border-parchment-edge-strong bg-parchment px-4 py-[13px] font-mono text-xl tracking-[0.15em] text-ink shadow-[inset_0_1px_2px_rgba(10,60,54,0.05)] placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-gold/40 dark:bg-parchment-deep dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]"
                  />
                  <button
                    type="submit"
                    className={cn(
                      primaryBtn,
                      'mt-2.5 w-full px-5 py-3 text-[13px]',
                    )}
                  >
                    <Check className="h-3.5 w-3.5 text-gold" />
                    {t('Check in')}
                  </button>
                </form>
              )}
              {deskEntry === 'qr' && (
                <QRScanner
                  active
                  onMemberId={handleQRDecoded}
                  presentCount={presentCount}
                  total={total}
                />
              )}
              {deskEntry === 'list' && (
                <p className="rounded-xl border border-dashed border-parchment-edge px-4 py-5 text-center text-xs leading-relaxed text-ink-muted">
                  {t(
                    'Mark each member present (P), late (L) or absent (A) in the member list.',
                  )}
                </p>
              )}
            </Card>

            {/* Recent */}
            <Card>
              <div className="mb-2 flex items-baseline justify-between">
                <Eyebrow>{t('Recent')}</Eyebrow>
                {checkInLogs.length > 0 && (
                  <span className="font-mono text-[10px] text-ink-muted">
                    {lastN}
                  </span>
                )}
              </div>
              {recentRows('desktop')}
            </Card>
          </div>

          {/* Member list */}
          <Card className="p-[22px]">
            <div className="mb-3.5 flex items-center justify-between gap-3">
              <SectionHeader en="Member list" />
              {searchBox('w-60', deskSearchRef)}
            </div>

            {filteredMembers.length === 0 ? (
              <p className="py-12 text-center text-sm text-ink-muted">
                {t('No members found')}
              </p>
            ) : (
              <>
                <div className="grid grid-cols-[80px_minmax(0,1fr)_auto] gap-3 border-b border-parchment-edge-strong px-1 pb-[9px]">
                  {[t('ID'), t('Member'), t('Status')].map((h) => (
                    <span
                      key={h}
                      className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gold-deep last:w-[94px]"
                    >
                      {h}
                    </span>
                  ))}
                </div>
                {pageMembers.map((m) => (
                  <div
                    key={m.id}
                    className="grid grid-cols-[80px_minmax(0,1fr)_auto] items-center gap-3 border-b border-parchment-edge px-1 py-3"
                  >
                    <span className="font-mono text-[10.5px] text-ink-muted">
                      {m.memberId}
                    </span>
                    <span className="truncate text-[13px] font-medium text-ink">
                      {fullName(m)}
                    </span>
                    {statusButtons(m, 'sm')}
                  </div>
                ))}
              </>
            )}

            {filteredMembers.length > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-3">
                <span className="text-[11px] text-ink-muted">
                  {t('{from}–{to} of {total}', {
                    from: safePage * PAGE_SIZE + 1,
                    to: Math.min(
                      (safePage + 1) * PAGE_SIZE,
                      filteredMembers.length,
                    ),
                    total: filteredMembers.length,
                  })}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={safePage === 0}
                    aria-label={t('Previous page')}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-parchment-edge text-ink-muted hover:bg-parchment-deep disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="font-mono text-[11px] tabular-nums text-ink">
                    {safePage + 1} / {pageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((p) => Math.min(pageCount - 1, p + 1))
                    }
                    disabled={safePage >= pageCount - 1}
                    aria-label={t('Next page')}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-parchment-edge text-ink-muted hover:bg-parchment-deep disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
