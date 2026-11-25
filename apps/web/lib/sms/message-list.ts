/**
 * The messages list (/admin/messages): filters kept in the URL, the status
 * chips and row pills, period bounds (Ethiopian months) and page maths.
 * Pure: lib/sms/message-list-queries.ts turns the filters into SQL (and
 * repeats `matchesStatusFilter` there).
 */
import type { BroadcastStatus } from '@felege-yordanos/db/schema';
import { ethiopianPeriods, type EthiopianPeriod } from '../ethiopian-periods';
import { eatMoment } from './schedule';

export const MESSAGE_STATUS_FILTERS = [
  'all',
  'scheduled',
  'sending',
  'done',
  'problem',
] as const;
export type MessageStatusFilter = (typeof MESSAGE_STATUS_FILTERS)[number];

export const MESSAGE_PERIODS = ['this_month', 'last_month', 'all'] as const;
export type MessagePeriod = (typeof MESSAGE_PERIODS)[number];

export const PER_PAGE_OPTIONS = [10, 25, 50] as const;
export type PerPage = (typeof PER_PAGE_OPTIONS)[number];
export const DEFAULT_PER_PAGE: PerPage = 10;

/** At most this many words of the search are used (each must match). */
export const MAX_SEARCH_WORDS = 5;

export interface MessageFilters {
  status: MessageStatusFilter;
  /** 'all', 'me' or a user id (super admins only; others see their own). */
  sender: string;
  period: MessagePeriod;
  /** Words in the message text. */
  q: string;
  page: number;
  per: PerPage;
}

export const DEFAULT_MESSAGE_FILTERS: MessageFilters = {
  status: 'all',
  sender: 'all',
  period: 'this_month',
  q: '',
  page: 1,
  per: DEFAULT_PER_PAGE,
};

type Params = Record<string, string | string[] | undefined>;

const one = (p: Params, key: string) => {
  const v = p[key];
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? '';
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const oneOf = <T extends string>(list: readonly T[], v: string, fallback: T): T =>
  (list as readonly string[]).includes(v) ? (v as T) : fallback;

/** Filters from the URL; anything unknown or out of range is the default. */
export function parseMessageFilters(p: Params): MessageFilters {
  const sender = one(p, 'sender');
  const page = one(p, 'page');
  const per = Number(one(p, 'per'));
  return {
    status: oneOf(MESSAGE_STATUS_FILTERS, one(p, 'status'), 'all'),
    sender: sender === 'me' || UUID.test(sender) ? sender.toLowerCase() : 'all',
    period: oneOf(MESSAGE_PERIODS, one(p, 'period'), 'this_month'),
    q: one(p, 'q').replace(/\s+/g, ' ').slice(0, 100),
    page: /^\d{1,6}$/.test(page) && Number(page) >= 1 ? Number(page) : 1,
    per: (PER_PAGE_OPTIONS as readonly number[]).includes(per)
      ? (per as PerPage)
      : DEFAULT_PER_PAGE,
  };
}

/**
 * URL query of the filters (defaults left out). Any change other than the
 * page goes back to page 1.
 */
export function messagesQuery(
  f: MessageFilters,
  change: Partial<MessageFilters> = {},
): string {
  const resets = Object.keys(change).some((k) => k !== 'page');
  const v = { ...f, ...(resets ? { page: 1 } : {}), ...change };
  const q = new URLSearchParams();
  if (v.status !== 'all') q.set('status', v.status);
  if (v.sender !== 'all') q.set('sender', v.sender);
  if (v.period !== 'this_month') q.set('period', v.period);
  if (v.q) q.set('q', v.q);
  if (v.per !== DEFAULT_PER_PAGE) q.set('per', String(v.per));
  if (v.page > 1) q.set('page', String(v.page));
  return q.toString();
}

export const messagesHref = (
  f: MessageFilters,
  change: Partial<MessageFilters> = {},
) => {
  const q = messagesQuery(f, change);
  return q ? `/admin/messages?${q}` : '/admin/messages';
};

/** Any filter (not page or rows per page) differs from the default. */
export const hasActiveFilters = (f: MessageFilters) =>
  f.status !== 'all' || f.sender !== 'all' || f.period !== 'this_month' || !!f.q;

/** Search words, each matched case-insensitively in the text. */
export const searchWords = (q: string): string[] =>
  q.split(' ').filter(Boolean).slice(0, MAX_SEARCH_WORDS);

/**
 * Whose messages the page shows: null = everyone's. Super admins choose
 * (sender filter), everyone else sees only their own.
 */
export function senderScope(
  f: Pick<MessageFilters, 'sender'>,
  user: { id: string; superAdmin: boolean },
): string | null {
  if (!user.superAdmin) return user.id;
  if (f.sender === 'all') return null;
  return f.sender === 'me' ? user.id : f.sender;
}

/* ─── Statuses ───────────────────────────────────────────────── */

/**
 * Whether a broadcast is under a status chip. Sending = queued + sending;
 * Paused or failed = paused, missed, or done with failed or unknown
 * deliveries; cancelled only under All.
 */
export function matchesStatusFilter(
  filter: MessageStatusFilter,
  status: BroadcastStatus,
  failedDeliveries: number,
): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'scheduled':
      return status === 'scheduled';
    case 'sending':
      return status === 'queued' || status === 'sending';
    case 'done':
      return status === 'done';
    case 'problem':
      return (
        status === 'paused' ||
        status === 'missed' ||
        (status === 'done' && failedDeliveries > 0)
      );
  }
}

export type RowStatus = 'scheduled' | 'sending' | 'done' | 'paused' | 'missed' | 'cancelled';

/** The pill of a row: queued shows as Sending. */
export const rowStatus = (status: BroadcastStatus): RowStatus =>
  status === 'queued' ? 'sending' : status;

/* ─── Period ─────────────────────────────────────────────────── */

export interface PeriodBounds {
  /** Inclusive start and exclusive end (Addis Ababa midnight). */
  from: Date;
  to: Date;
  /** The Ethiopian month (for its name). */
  month: EthiopianPeriod;
}

const nextYmd = (ymd: string) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

/**
 * This or last Ethiopian month (lib/ethiopian-periods.ts) for `today`
 * (YYYY-MM-DD, Addis Ababa) as instants; null for all time.
 */
export function periodBounds(period: MessagePeriod, today: string): PeriodBounds | null {
  if (period === 'all') return null;
  const months = ethiopianPeriods(today, 2).filter((p) => p.kind === 'month');
  const month = months[period === 'this_month' ? 0 : 1];
  return {
    from: eatMoment(month.from, '00:00'),
    to: eatMoment(nextYmd(month.to), '00:00'),
    month,
  };
}

/* ─── Pages ──────────────────────────────────────────────────── */

export interface Paging {
  pages: number;
  /** The page shown: a page past the end shows the last one. */
  page: number;
  offset: number;
  /** "Showing a to b of n" (0 to 0 when there is nothing). */
  first: number;
  last: number;
}

export function paging(total: number, page: number, per: number): Paging {
  const pages = Math.max(1, Math.ceil(total / per));
  const p = Math.min(Math.max(1, page), pages);
  const offset = (p - 1) * per;
  return {
    pages,
    page: p,
    offset,
    first: total === 0 ? 0 : offset + 1,
    last: Math.min(total, offset + per),
  };
}

/**
 * Page numbers to show: the first, the last, and one on each side of the
 * current page, with 'gap' where pages are left out (a gap of one page
 * shows that page instead).
 */
export function pageList(page: number, pages: number): (number | 'gap')[] {
  const keep = new Set([1, pages, page - 1, page, page + 1]);
  const out: (number | 'gap')[] = [];
  let prev = 0;
  for (let n = 1; n <= pages; n += 1) {
    if (!keep.has(n)) continue;
    if (n - prev === 2) out.push(n - 1);
    else if (n - prev > 2) out.push('gap');
    out.push(n);
    prev = n;
  }
  return out;
}

/* ─── Scheduled work ─────────────────────────────────────────── */

/** Days ahead the credit warning looks at. */
export const WARN_DAYS = 7;

export interface ScheduledEstimate {
  at: Date;
  /** Estimated credits; null when it could not be worked out. */
  credits: number | null;
}

/**
 * Credits the scheduled work of the next WARN_DAYS days needs, and the first
 * one (by time) the balance no longer covers, counting the ones before it.
 * No balance (null): no shortfall.
 */
export function creditOutlook(
  items: ScheduledEstimate[],
  balance: number | null,
  now: Date,
): { needed: number; short: { at: Date; needed: number } | null } {
  const until = now.getTime() + WARN_DAYS * 24 * 3600 * 1000;
  const soon = items
    .filter((i) => i.at.getTime() <= until)
    .sort((a, b) => a.at.getTime() - b.at.getTime());
  let needed = 0;
  let short: { at: Date; needed: number } | null = null;
  for (const i of soon) {
    needed += i.credits ?? 0;
    if (!short && balance !== null && needed > balance) short = { at: i.at, needed };
  }
  return { needed, short };
}
