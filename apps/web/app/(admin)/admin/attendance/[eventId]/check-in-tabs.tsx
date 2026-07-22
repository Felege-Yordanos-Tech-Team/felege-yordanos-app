'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { createClient } from '@felege-yordanos/db';
import type { Member } from '@felege-yordanos/db';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  List,
  ScanLine,
  Search,
  Zap,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { QRScanner, type ScanResult } from './qr-scanner';

type AttendanceStatus = 'present' | 'absent' | 'late';

interface AttendanceRow {
  id: string;
  event_id: string;
  member_id: number;
  status: AttendanceStatus;
  marked_by: string | null;
  created_at: string;
}

interface CheckInTabsProps {
  eventId: string;
  members: Member[];
  attendance: AttendanceRow[];
  userId: string;
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
  Exclude<AttendanceStatus, never>,
  { label: 'P' | 'L' | 'A'; active: string; idle: string }
> = {
  present: {
    label: 'P',
    active:
      'bg-status-present text-cream border-transparent shadow-[0_2px_8px_-2px_rgba(79,123,62,0.5)]',
    idle:
      'border border-border bg-card text-status-present hover:bg-status-present/[0.08]',
  },
  late: {
    label: 'L',
    active:
      'bg-status-late text-cream border-transparent shadow-[0_2px_8px_-2px_rgba(201,123,26,0.5)]',
    idle:
      'border border-border bg-card text-status-late hover:bg-status-late/[0.08]',
  },
  absent: {
    label: 'A',
    active:
      'bg-status-absent text-cream border-transparent shadow-[0_2px_8px_-2px_rgba(161,40,49,0.5)]',
    idle:
      'border border-border bg-card text-status-absent hover:bg-status-absent/[0.08]',
  },
};

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** Members per page in the desktop member table. */
const PAGE_SIZE = 12;

export function CheckInTabs({ eventId, members, attendance, userId }: CheckInTabsProps) {
  const [tab, setTab] = useState<'quick' | 'member-list' | 'qr-scan'>('quick');
  const [records, setRecords] = useState<Record<number, AttendanceStatus>>(() => {
    const map: Record<number, AttendanceStatus> = {};
    for (const a of attendance) {
      map[a.member_id] = a.status;
    }
    return map;
  });
  const [search, setSearch] = useState('');
  const [quickInput, setQuickInput] = useState('');
  const [checkInLogs, setCheckInLogs] = useState<CheckInLog[]>([]);
  const [page, setPage] = useState(0);
  const [deskEntry, setDeskEntry] = useState<'quick' | 'qr'>('quick');
  const quickInputRef = useRef<HTMLInputElement>(null);
  const deskQuickRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Refocus whichever quick-entry input is visible (mobile tab vs desktop rail).
  const focusQuick = useCallback(() => {
    quickInputRef.current?.focus();
    deskQuickRef.current?.focus();
  }, []);

  const membersByMemberId = useMemo(() => {
    const map = new Map<string, Member>();
    for (const m of members) map.set(m.member_id, m);
    return map;
  }, [members]);

  const presentCount = useMemo(
    () =>
      Object.values(records).filter((s) => s === 'present' || s === 'late').length,
    [records],
  );
  const total = members.length;
  const progress = total ? Math.min(100, (presentCount / total) * 100) : 0;

  const upsertAttendance = useCallback(
    async (memberId: number, status: AttendanceStatus) => {
      const supabase = createClient();
      const { error } = await supabase.from('attendance').upsert(
        {
          event_id: eventId,
          member_id: memberId,
          status,
          marked_by: userId,
        } as never,
        { onConflict: 'event_id,member_id' },
      );

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return false;
      }

      setRecords((prev) => ({ ...prev, [memberId]: status }));
      return true;
    },
    [eventId, userId, toast],
  );

  const filteredMembers = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.father_name?.toLowerCase().includes(q) ||
      m.member_id.toLowerCase().includes(q)
    );
  });

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

    const member = members.find((m) => m.member_id === id);
    if (!member) {
      toast({ title: 'Not found', description: 'Member ID not found', variant: 'destructive' });
      setQuickInput('');
      focusQuick();
      return;
    }

    const fullName = [member.name, member.father_name].filter(Boolean).join(' ');

    if (records[member.id] === 'present' || records[member.id] === 'late') {
      toast({ title: fullName, description: 'Already checked in' });
      setQuickInput('');
      focusQuick();
      return;
    }

    const ok = await upsertAttendance(member.id, 'present');
    if (ok) {
      toast({ title: fullName, description: 'Checked in' });
      setCheckInLogs((prev) => [
        {
          name: fullName,
          memberId: member.member_id,
          time: formatTime(new Date()),
          status: 'present',
        },
        ...prev.slice(0, 9),
      ]);
    }

    setQuickInput('');
    quickInputRef.current?.focus();
  }

  const latest = checkInLogs[0];

  async function handleQRDecoded(decoded: string): Promise<ScanResult> {
    const code = decoded.trim();
    const member = membersByMemberId.get(code);
    if (!member) {
      return { kind: 'invalid', code };
    }
    const fullName = [member.name, member.father_name].filter(Boolean).join(' ');
    if (records[member.id] === 'present' || records[member.id] === 'late') {
      return { kind: 'already', name: fullName, memberId: member.member_id };
    }
    const ok = await upsertAttendance(member.id, 'present');
    if (!ok) {
      return { kind: 'invalid', code };
    }
    const time = formatTime(new Date());
    setCheckInLogs((prev) => [
      { name: fullName, memberId: member.member_id, time, status: 'present' },
      ...prev.slice(0, 9),
    ]);
    return { kind: 'success', name: fullName, memberId: member.member_id, time };
  }

  return (
    <>
    {/* ─────────────── MOBILE (< md) — tabbed ─────────────── */}
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as typeof tab)}
      className="w-full md:hidden"
    >
      <TabsList className="mb-3.5 grid w-full grid-cols-3 rounded-xl bg-input p-1">
        <TabsTrigger
          value="quick"
          className="gap-1.5 rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-burgundy-ink data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground dark:data-[state=active]:text-cream"
        >
          <Zap className="h-3.5 w-3.5" />
          Quick
        </TabsTrigger>
        <TabsTrigger
          value="member-list"
          className="gap-1.5 rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-burgundy-ink data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground dark:data-[state=active]:text-cream"
        >
          <List className="h-3.5 w-3.5" />
          List
        </TabsTrigger>
        <TabsTrigger
          value="qr-scan"
          className="gap-1.5 rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-burgundy-ink data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground dark:data-[state=active]:text-cream"
        >
          <ScanLine className="h-3.5 w-3.5" />
          QR
        </TabsTrigger>
      </TabsList>

      {/* Quick mode */}
      <TabsContent value="quick" className="mt-0">
        {/* Counter card */}
        <section className="sacred-gradient relative mb-3.5 overflow-hidden rounded-2xl border border-gold/25 px-5 py-[18px] text-cream shadow-fy-lg">
          <div className="tibeb-gold absolute inset-0 opacity-40" />
          <div className="relative">
            <div className="flex items-baseline justify-between">
              <div className="font-ethiopic text-[11px] tracking-[0.06em] text-gold-light">
                አባላት ተገኝተዋል
              </div>
              <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-gold-light/70">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-status-present"
                  style={{ boxShadow: '0 0 6px #4F7B3E' }}
                />
                Live
              </div>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-[64px] font-medium leading-[0.95] tracking-tight tabular-nums text-gold">
                {presentCount}
              </span>
              <span className="font-display text-[28px] font-normal tabular-nums text-gold-light/50">
                / {total}
              </span>
              <span className="ml-auto text-[11px] text-cream/60">present</span>
            </div>
            <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-cream/[0.12]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light shadow-[0_0_8px_rgba(212,168,67,0.5)] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </section>

        {/* Scan input */}
        <form onSubmit={handleQuickCheckIn} className="mb-3.5">
          <div className="flex items-center gap-2.5 rounded-2xl border-2 border-gold bg-card px-3.5 py-3 shadow-[0_0_0_4px_rgba(212,168,67,0.15),0_4px_16px_-6px_rgba(212,168,67,0.3)]">
            <ScanLine className="h-5 w-5 shrink-0 text-burgundy dark:text-gold" />
            <Input
              ref={quickInputRef}
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Enter member ID…"
              autoFocus
              className="h-auto border-none bg-transparent p-0 font-mono text-lg font-medium tracking-[0.08em] text-foreground shadow-none placeholder:font-mono placeholder:text-base placeholder:tracking-normal focus-visible:ring-0"
            />
            <span className="hidden text-[9px] font-semibold uppercase tracking-[0.14em] text-gold-deep dark:text-gold sm:inline">
              Enter ↵
            </span>
          </div>
        </form>

        {/* Last check-in confirmation banner */}
        {latest && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-status-present/30 bg-gradient-to-br from-status-present-bg to-status-present-bg/60 px-4 py-3 dark:from-status-present/[0.25] dark:to-status-present/[0.10] dark:border-status-present/40">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-present">
              <Check className="h-[22px] w-[22px] text-cream" strokeWidth={3} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-lg font-medium leading-tight text-burgundy-ink dark:text-foreground">
                {latest.name}
              </div>
              <div className="mt-0.5 text-[11px] font-semibold text-status-present">
                Checked in · {latest.memberId}
              </div>
            </div>
            <div className="shrink-0 font-mono text-[11px] font-semibold text-status-present">
              {latest.time}
            </div>
          </div>
        )}

        {/* Recent log */}
        <div className="mb-2 flex items-baseline justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep dark:text-gold">
            Recent
          </div>
          {checkInLogs.length > 0 && (
            <span className="font-mono text-[10px] text-muted-foreground">
              last {Math.min(checkInLogs.length, 10)}
            </span>
          )}
        </div>

        {checkInLogs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card/40 py-6 text-center text-[12px] text-muted-foreground">
            No check-ins yet. Enter a member ID above.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {checkInLogs.map((log, i) => (
              <div
                key={`${log.memberId}-${i}`}
                className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 ${
                  i === 0 ? 'border border-border bg-card' : 'border border-transparent'
                }`}
              >
                <span
                  aria-hidden
                  className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[log.status]}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-[15px] font-medium leading-tight text-burgundy-ink dark:text-cream">
                    {log.name}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {log.memberId}
                  </div>
                </div>
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {log.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      {/* Member list mode */}
      <TabsContent value="member-list" className="mt-0">
        {/* Compact ratio pill */}
        <div className="mb-3.5 flex items-center justify-end">
          <div className="sacred-gradient inline-flex items-baseline gap-1 rounded-full border border-gold/30 px-3 py-1.5">
            <span className="font-mono text-sm font-semibold tabular-nums text-gold">
              {presentCount}
            </span>
            <span className="font-mono text-[10px] text-gold/60">/ {total}</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3.5">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <Input
            placeholder="Search members…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-[10px] border border-border bg-card pl-[34px] text-[12.5px] placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-gold/30"
          />
          {search && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] text-muted-foreground">
              {filteredMembers.length} {filteredMembers.length === 1 ? 'match' : 'matches'}
            </span>
          )}
        </div>

        {/* Member rows */}
        {filteredMembers.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No members found</p>
        ) : (
          <div className="flex flex-col gap-1">
            {filteredMembers.map((m) => {
              const current = records[m.id];
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2.5 rounded-[10px] border border-border bg-card px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold leading-tight text-burgundy-ink dark:text-cream">
                      {[m.name, m.father_name].filter(Boolean).join(' ')}
                    </div>
                    <div className="mt-0.5 font-mono text-[9.5px] text-muted-foreground">
                      {m.member_id}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {(['present', 'late', 'absent'] as AttendanceStatus[]).map((status) => {
                      const cfg = STATUS_BTN[status];
                      const active = current === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => upsertAttendance(m.id, status)}
                          aria-label={`${cfg.label} for ${m.name}`}
                          className={`flex h-8 w-8 items-center justify-center rounded-[9px] text-[13px] font-bold transition-colors ${
                            active ? cfg.active : cfg.idle
                          }`}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </TabsContent>

      {/* QR scan mode */}
      <TabsContent value="qr-scan" className="mt-0">
        <QRScanner
          active={tab === 'qr-scan'}
          onMemberId={handleQRDecoded}
          presentCount={presentCount}
          total={total}
        />
      </TabsContent>
    </Tabs>

    {/* ─────────────── DESKTOP (md+) — two columns ─────────────── */}
    <div className="hidden md:grid md:grid-cols-[minmax(0,360px)_minmax(0,1fr)] md:items-start md:gap-6">
      {/* Left rail: counter + entry + recent */}
      <div className="space-y-4">
        {/* Counter */}
        <section className="sacred-gradient relative overflow-hidden rounded-2xl border border-gold/25 px-5 py-[18px] text-cream shadow-fy-lg">
          <div className="tibeb-gold absolute inset-0 opacity-40" />
          <div className="relative">
            <div className="flex items-baseline justify-between">
              <div className="font-ethiopic text-[11px] tracking-[0.06em] text-gold-light">
                አባላት ተገኝተዋል
              </div>
              <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-gold-light/70">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-status-present"
                  style={{ boxShadow: '0 0 6px #4F7B3E' }}
                />
                Live
              </div>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-[56px] font-medium leading-[0.95] tracking-tight tabular-nums text-gold">
                {presentCount}
              </span>
              <span className="font-display text-[26px] font-normal tabular-nums text-gold-light/50">
                / {total}
              </span>
              <span className="ml-auto text-[11px] text-cream/60">present</span>
            </div>
            <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-cream/[0.12]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light shadow-[0_0_8px_rgba(212,168,67,0.5)] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </section>

        {/* Entry: Quick ID / QR scan */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-fy-sm">
          <div className="mb-3 flex items-center rounded-lg border border-border bg-input p-0.5">
            {(['quick', 'qr'] as const).map((mode) => {
              const active = deskEntry === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDeskEntry(mode)}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-card text-burgundy-ink shadow-sm dark:text-cream'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mode === 'quick' ? (
                    <>
                      <Zap className="h-3.5 w-3.5" /> Quick ID
                    </>
                  ) : (
                    <>
                      <ScanLine className="h-3.5 w-3.5" /> QR scan
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {deskEntry === 'quick' ? (
            <form onSubmit={handleQuickCheckIn} className="space-y-2.5">
              <div className="flex items-center gap-2.5 rounded-xl border-2 border-gold bg-background px-3 py-2.5 shadow-[0_0_0_4px_rgba(212,168,67,0.12)]">
                <ScanLine className="h-5 w-5 shrink-0 text-burgundy dark:text-gold" />
                <Input
                  ref={deskQuickRef}
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="Enter member ID…"
                  className="h-auto border-none bg-transparent p-0 font-mono text-base font-medium tracking-[0.08em] text-foreground shadow-none placeholder:font-mono placeholder:text-sm placeholder:tracking-normal focus-visible:ring-0"
                />
              </div>
              <button
                type="submit"
                className="sacred-gradient flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 py-2.5 text-sm font-semibold text-cream shadow-fy-md hover:opacity-95"
              >
                <Check className="h-4 w-4" /> Check in
              </button>
            </form>
          ) : (
            <QRScanner
              active={deskEntry === 'qr'}
              onMemberId={handleQRDecoded}
              presentCount={presentCount}
              total={total}
            />
          )}
        </div>

        {/* Recent */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-fy-sm">
          <div className="mb-2 flex items-baseline justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep dark:text-gold">
              Recent
            </div>
            {checkInLogs.length > 0 && (
              <span className="font-mono text-[10px] text-muted-foreground">
                last {Math.min(checkInLogs.length, 10)}
              </span>
            )}
          </div>
          {checkInLogs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-card/40 py-5 text-center text-[12px] text-muted-foreground">
              No check-ins yet.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {checkInLogs.map((log, i) => (
                <div
                  key={`d-${log.memberId}-${i}`}
                  className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-2"
                >
                  <span
                    aria-hidden
                    className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[log.status]}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-[14px] font-medium leading-tight text-burgundy-ink dark:text-cream">
                      {log.name}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {log.memberId}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                    {log.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: searchable, paginated member table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-fy-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <div className="font-ethiopic text-[11px] font-medium tracking-[0.06em] text-gold-deep dark:text-gold">
              የአባላት ዝርዝር
            </div>
            <h3 className="font-display text-xl font-medium leading-tight text-burgundy-ink dark:text-cream">
              Member list
            </h3>
          </div>
          <div className="relative w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
            <Input
              placeholder="Name or ID…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="rounded-lg border border-border bg-background pl-[34px] text-[13px] focus-visible:ring-2 focus-visible:ring-gold/30"
            />
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No members found
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  ID
                </th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Member
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {pageMembers.map((m) => {
                const current = records[m.id];
                return (
                  <tr
                    key={m.id}
                    className="border-b border-border/50 transition-colors last:border-0 hover:bg-parchment/40 dark:hover:bg-card/60"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[12px] text-muted-foreground">
                      {m.member_id}
                    </td>
                    <td className="px-4 py-2.5 text-[13.5px] font-medium text-burgundy-ink dark:text-cream">
                      {[m.name, m.father_name].filter(Boolean).join(' ')}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1">
                        {(['present', 'late', 'absent'] as AttendanceStatus[]).map(
                          (status) => {
                            const cfg = STATUS_BTN[status];
                            const active = current === status;
                            return (
                              <button
                                key={status}
                                type="button"
                                onClick={() => upsertAttendance(m.id, status)}
                                aria-label={`${cfg.label} for ${m.name}`}
                                className={`flex h-8 w-8 items-center justify-center rounded-[9px] text-[13px] font-bold transition-colors ${
                                  active ? cfg.active : cfg.idle
                                }`}
                              >
                                {cfg.label}
                              </button>
                            );
                          },
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {filteredMembers.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-[11px] text-muted-foreground">
              {safePage * PAGE_SIZE + 1}–
              {Math.min((safePage + 1) * PAGE_SIZE, filteredMembers.length)} of{' '}
              {filteredMembers.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                aria-label="Previous page"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-background disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-mono text-[11px] tabular-nums text-foreground">
                {safePage + 1} / {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={safePage >= pageCount - 1}
                aria-label="Next page"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-background disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
