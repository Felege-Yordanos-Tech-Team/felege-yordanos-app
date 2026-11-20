/**
 * Reads for the messages page (/admin/messages): one page of broadcasts
 * with their totals, the summary tiles, the scheduled work with its credit
 * estimate, the provider balance and the senders. The rules (filters,
 * chips, period, pages) are in lib/sms/message-list.ts.
 *
 * Callers check canSendMessages first and pass the sender scope from
 * `senderScope` (super admins all or one sender, everyone else their own).
 * No phone numbers and no message text leave here except the text itself.
 */
import 'server-only';
import { and, asc, count, eq, isNotNull, sql, type SQL } from 'drizzle-orm';
import {
  db,
  eventReminders,
  events,
  messageBroadcasts,
  type BroadcastAudience,
  type BroadcastOrigin,
  type BroadcastStatus,
} from '@felege-yordanos/db/server';
import {
  searchWords,
  type MessageFilters,
  type PeriodBounds,
} from './message-list';
import { summarize } from './message-audience';
import { loadBroadcastTargets, loadSelection } from './message-queries';
import { reminderText } from './reminders';
import { escapeLike } from './selected-people';
import { composeSms, estimateCredits } from './split';
import { smsSignature, smsTransport } from './transport';

/* ─── Filters as SQL ────────────────────────────────────────── */

const senderName = sql`coalesce(nullif(p.display_name, ''), u.name, u.email)`;

/** When a message went out (or goes out): its scheduled time, else created. */
const whenSql = sql`coalesce(b.scheduled_at, b.created_at)`;

const hasFailedDelivery = sql`EXISTS (
  SELECT 1 FROM message_deliveries d
  JOIN message_recipients r ON r.id = d.recipient_id
  WHERE r.broadcast_id = b.id AND d.status IN ('failed', 'unknown')
)`;

/** Same rule as matchesStatusFilter (lib/sms/message-list.ts). */
function statusSql(f: MessageFilters): SQL | undefined {
  switch (f.status) {
    case 'all':
      return undefined;
    case 'scheduled':
      return sql`b.status = 'scheduled'`;
    case 'sending':
      return sql`b.status IN ('queued', 'sending')`;
    case 'done':
      return sql`b.status = 'done'`;
    case 'problem':
      return sql`(b.status IN ('paused', 'missed') OR (b.status = 'done' AND ${hasFailedDelivery}))`;
  }
}

const scopeSql = (createdBy: string | null) =>
  createdBy ? sql`b.created_by = ${createdBy}::uuid` : undefined;

const periodSql = (period: PeriodBounds | null) =>
  period
    ? sql`(${whenSql} >= ${period.from.toISOString()}::timestamptz AND ${whenSql} < ${period.to.toISOString()}::timestamptz)`
    : undefined;

const searchSql = (q: string) => {
  const words = searchWords(q);
  if (!words.length) return undefined;
  return sql.join(
    words.map((w) => sql`b.text ILIKE ${`%${escapeLike(w)}%`} ESCAPE '\\'`),
    sql` AND `,
  );
};

const whereOf = (parts: (SQL | undefined)[]) => {
  const list = parts.filter((p): p is SQL => !!p);
  return list.length ? sql`WHERE ${sql.join(list, sql` AND `)}` : sql``;
};

/* ─── The list ──────────────────────────────────────────────── */

export interface MessageRow {
  id: string;
  text: string;
  status: BroadcastStatus;
  audience: BroadcastAudience;
  origin: BroadcastOrigin;
  eventId: string | null;
  eventTitle: string | null;
  createdBy: string | null;
  senderName: string | null;
  createdAt: Date;
  scheduledAt: Date | null;
  /** SMS parts per person as stored (scheduled ones are rebuilt when they fire). */
  smsParts: number;
  /** Audience 'selected': how many people were chosen. */
  targetCount: number;
  /** Recipients that were or are to be sent to (not skipped). */
  people: number;
  sent: number;
  /** Deliveries failed or unknown. */
  failedDeliveries: number;
  /** Sum of the provider's credits_used. */
  credits: number;
}

interface RawRow extends Record<string, unknown> {
  id: string;
  text: string;
  status: BroadcastStatus;
  audience: BroadcastAudience;
  origin: BroadcastOrigin;
  event_id: string | null;
  event_title: string | null;
  created_by: string | null;
  sender_name: string | null;
  created_at: string | Date;
  scheduled_at: string | Date | null;
  sms_parts: number;
  target_count: number;
  people: number;
  sent: number;
  failed: number;
  credits: number;
}

const toDate = (v: string | Date) => (v instanceof Date ? v : new Date(v));

/**
 * The broadcasts matching the filters: how many, and one page of them
 * (`offset`, `limit`) with their totals. Scheduled ones are always in the
 * period (they have not gone out yet) and come first, soonest first; then
 * newest first by when they went out.
 */
export async function loadMessagePage(input: {
  filters: MessageFilters;
  createdBy: string | null;
  period: PeriodBounds | null;
}): Promise<{ total: number; load: (offset: number, limit: number) => Promise<MessageRow[]> }> {
  const { filters, createdBy, period } = input;
  const p = periodSql(period);
  const where = whereOf([
    scopeSql(createdBy),
    statusSql(filters),
    p ? sql`(b.status = 'scheduled' OR ${p})` : undefined,
    searchSql(filters.q),
  ]);
  const totalRows = (await db.execute(
    sql`SELECT count(*)::int AS n FROM message_broadcasts b ${where}`,
  )) as unknown as { n: number }[];
  const total = totalRows[0]?.n ?? 0;

  const order = sql`(b.status = 'scheduled') DESC,
    CASE WHEN b.status = 'scheduled' THEN b.scheduled_at END ASC,
    ${whenSql} DESC, b.id`;

  const load = async (offset: number, limit: number): Promise<MessageRow[]> => {
    if (total === 0) return [];
    const rows = (await db.execute(sql`
      WITH page AS (
        SELECT b.* FROM message_broadcasts b
        ${where}
        ORDER BY ${order}
        LIMIT ${limit} OFFSET ${offset}
      )
      SELECT
        b.id, b.text, b.status, b.audience, b.origin, b.event_id,
        e.title AS event_title, b.created_by, ${senderName} AS sender_name,
        b.created_at, b.scheduled_at, b.sms_parts,
        (SELECT count(*)::int FROM message_broadcast_targets t WHERE t.broadcast_id = b.id) AS target_count,
        coalesce(rt.people, 0)::int AS people,
        coalesce(rt.sent, 0)::int AS sent,
        coalesce(dt.failed, 0)::int AS failed,
        coalesce(dt.credits, 0)::int AS credits
      FROM page b
      LEFT JOIN events e ON e.id = b.event_id
      LEFT JOIN profiles p ON p.id = b.created_by
      LEFT JOIN auth_users u ON u.id = b.created_by
      LEFT JOIN LATERAL (
        SELECT
          count(*) FILTER (WHERE r.status <> 'skipped') AS people,
          count(*) FILTER (WHERE r.status = 'sent') AS sent
        FROM message_recipients r WHERE r.broadcast_id = b.id
      ) rt ON true
      LEFT JOIN LATERAL (
        SELECT
          count(*) FILTER (WHERE d.status IN ('failed', 'unknown')) AS failed,
          sum(d.credits_used) AS credits
        FROM message_deliveries d
        JOIN message_recipients r ON r.id = d.recipient_id
        WHERE r.broadcast_id = b.id
      ) dt ON true
      ORDER BY ${order}
    `)) as unknown as RawRow[];
    return rows.map((r) => ({
      id: r.id,
      text: r.text,
      status: r.status,
      audience: r.audience,
      origin: r.origin,
      eventId: r.event_id,
      eventTitle: r.event_title,
      createdBy: r.created_by,
      senderName: r.sender_name,
      createdAt: toDate(r.created_at),
      scheduledAt: r.scheduled_at ? toDate(r.scheduled_at) : null,
      smsParts: Number(r.sms_parts),
      targetCount: Number(r.target_count),
      people: Number(r.people),
      sent: Number(r.sent),
      failedDeliveries: Number(r.failed),
      credits: Number(r.credits),
    }));
  };
  return { total, load };
}

/* ─── Summary tiles ─────────────────────────────────────────── */

export interface MessageSummary {
  /** Messages with at least one sent delivery. */
  sent: number;
  /** Different people with at least one sent delivery. */
  people: number;
  credits: number;
  /** Deliveries failed or unknown. */
  failed: number;
}

/**
 * Sent, people reached, credits used and failed for the sender scope and
 * period (a message counts in the period it went out, as in the list).
 * Status and search do not apply.
 */
export async function loadMessageSummary(input: {
  createdBy: string | null;
  period: PeriodBounds | null;
}): Promise<MessageSummary> {
  const where = whereOf([scopeSql(input.createdBy), periodSql(input.period)]);
  const rows = (await db.execute(sql`
    WITH d AS (
      SELECT r.broadcast_id, r.member_id, r.pre_member_id, d.status, d.credits_used
      FROM message_deliveries d
      JOIN message_recipients r ON r.id = d.recipient_id
      JOIN message_broadcasts b ON b.id = r.broadcast_id
      ${where}
    )
    SELECT
      (SELECT count(DISTINCT broadcast_id) FROM d WHERE status = 'sent')::int AS sent,
      (SELECT count(DISTINCT CASE WHEN member_id IS NOT NULL THEN 'm' || member_id ELSE 'p' || pre_member_id END)
         FROM d WHERE status = 'sent')::int AS people,
      (SELECT coalesce(sum(credits_used), 0) FROM d)::int AS credits,
      (SELECT count(*) FROM d WHERE status IN ('failed', 'unknown'))::int AS failed
  `)) as unknown as MessageSummary[];
  const r = rows[0];
  return {
    sent: Number(r?.sent ?? 0),
    people: Number(r?.people ?? 0),
    credits: Number(r?.credits ?? 0),
    failed: Number(r?.failed ?? 0),
  };
}

/** People who have sent a message (super admins' sender filter), by name. */
export async function loadSenders(): Promise<{ id: string; name: string }[]> {
  const rows = (await db.execute(sql`
    SELECT DISTINCT b.created_by AS id, ${senderName} AS name
    FROM message_broadcasts b
    LEFT JOIN profiles p ON p.id = b.created_by
    LEFT JOIN auth_users u ON u.id = b.created_by
    WHERE b.created_by IS NOT NULL
    ORDER BY name
  `)) as unknown as { id: string; name: string | null }[];
  return rows.map((r) => ({ id: r.id, name: r.name ?? '—' }));
}

/* ─── Scheduled work and credits ────────────────────────────── */

/**
 * At most this many of the earliest scheduled items get a credit estimate
 * (each works out today's recipients of its audience, like the compose page).
 */
export const MAX_ESTIMATED = 20;

export interface ScheduledItem {
  kind: 'broadcast' | 'reminder';
  /** Broadcast id, or the reminder's id. */
  id: string;
  at: Date;
}

export interface Estimate {
  recipients: number;
  credits: number;
}

/**
 * Estimates for scheduled broadcasts and reminders: today's recipients of
 * the audience × SMS parts (× 2 for Safaricom), as on the compose page.
 * Recipients of the same audience are worked out once per request.
 */
export function createEstimator() {
  const selections = new Map<string, ReturnType<typeof loadSelection>>();
  const selection = (key: string, load: () => ReturnType<typeof loadSelection>) => {
    let s = selections.get(key);
    if (!s) {
      s = load();
      selections.set(key, s);
    }
    return s;
  };

  const estimate = async (
    text: string,
    key: string,
    load: () => ReturnType<typeof loadSelection>,
  ): Promise<Estimate | null> => {
    const sms = composeSms(text, smsSignature());
    if (!sms.ok) return null;
    const loaded = await selection(key, load);
    if (!loaded) return null;
    const summary = summarize(loaded.selection);
    return {
      recipients: summary.recipients,
      credits: estimateCredits(sms.smsParts, summary),
    };
  };

  return {
    /** A scheduled broadcast (built as one message from its text). */
    broadcast(b: { id: string; text: string; audience: BroadcastAudience; eventId: string | null }) {
      if (b.audience === 'selected')
        return estimate(b.text, `selected:${b.id}`, async () =>
          loadSelection('selected', null, await loadBroadcastTargets(db, b.id)),
        );
      if (b.audience === 'event')
        return estimate(b.text, `event:${b.eventId}`, () => loadSelection('event', b.eventId));
      return estimate(b.text, b.audience, () => loadSelection(b.audience, null));
    },
    /** An event reminder: its text (or the default) to the event's expected people. */
    reminder(r: { text: string; eventId: string }) {
      return estimate(r.text, `event:${r.eventId}`, () => loadSelection('event', r.eventId));
    },
  };
}

export interface ScheduledWork {
  /** Scheduled broadcasts and scheduled event reminders. */
  count: number;
  next: Date | null;
  /** The earliest MAX_ESTIMATED with their estimate (null: could not be worked out). */
  items: (ScheduledItem & { credits: number | null })[];
}

/**
 * Scheduled broadcasts and event reminders not yet sent, for the sender
 * scope (a reminder belongs to whoever set it, like the broadcast it
 * becomes). Not filtered by period.
 */
export async function loadScheduledWork(
  createdBy: string | null,
  estimator: ReturnType<typeof createEstimator>,
): Promise<ScheduledWork> {
  const bScope = and(
    eq(messageBroadcasts.status, 'scheduled'),
    createdBy ? eq(messageBroadcasts.createdBy, createdBy) : undefined,
  );
  const rScope = and(
    eq(eventReminders.status, 'scheduled'),
    createdBy ? eq(eventReminders.setBy, createdBy) : undefined,
  );
  const [bCount, rCount, bRows, rRows] = await Promise.all([
    db.select({ n: count() }).from(messageBroadcasts).where(bScope),
    db.select({ n: count() }).from(eventReminders).where(rScope),
    db
      .select({
        id: messageBroadcasts.id,
        at: messageBroadcasts.scheduledAt,
        text: messageBroadcasts.text,
        audience: messageBroadcasts.audience,
        eventId: messageBroadcasts.eventId,
      })
      .from(messageBroadcasts)
      .where(and(bScope, isNotNull(messageBroadcasts.scheduledAt)))
      .orderBy(asc(messageBroadcasts.scheduledAt))
      .limit(MAX_ESTIMATED),
    db
      .select({
        id: eventReminders.id,
        at: eventReminders.dueAt,
        text: eventReminders.text,
        eventId: eventReminders.eventId,
        title: events.title,
        eventDate: events.eventDate,
        startTime: events.startTime,
      })
      .from(eventReminders)
      .innerJoin(events, eq(events.id, eventReminders.eventId))
      .where(rScope)
      .orderBy(asc(eventReminders.dueAt))
      .limit(MAX_ESTIMATED),
  ]);

  const merged = [
    ...bRows.map((b) => ({
      kind: 'broadcast' as const,
      id: b.id,
      at: b.at as Date,
      run: () => estimator.broadcast(b),
    })),
    ...rRows.map((r) => ({
      kind: 'reminder' as const,
      id: r.id,
      at: r.at,
      run: () =>
        estimator.reminder({
          text: reminderText(r, { title: r.title, eventDate: r.eventDate, startTime: r.startTime }),
          eventId: r.eventId,
        }),
    })),
  ]
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_ESTIMATED);

  const items = await Promise.all(
    merged.map(async ({ run, ...item }) => ({
      ...item,
      credits: (await run().catch(() => null))?.credits ?? null,
    })),
  );
  return {
    count: Number(bCount[0]?.n ?? 0) + Number(rCount[0]?.n ?? 0),
    next: merged[0]?.at ?? null,
    items,
  };
}

/** Estimates for the scheduled rows of a page, by broadcast id. */
export async function estimateRows(
  rows: MessageRow[],
  estimator: ReturnType<typeof createEstimator>,
): Promise<Map<string, Estimate | null>> {
  const scheduled = rows.filter((r) => r.status === 'scheduled');
  const out = await Promise.all(
    scheduled.map(async (r) => [r.id, await estimator.broadcast(r).catch(() => null)] as const),
  );
  return new Map(out);
}

/* ─── Balance ───────────────────────────────────────────────── */

/** How long the page waits for the provider's balance. */
const BALANCE_TIMEOUT_MS = 3000;

/**
 * The provider balance, or null when the transport has none (console, not
 * configured) or the provider does not answer in time.
 */
export async function readBalance(): Promise<number | null> {
  const transport = smsTransport();
  if (!transport.hasBalance || !transport.configured) return null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), BALANCE_TIMEOUT_MS);
  });
  try {
    return await Promise.race([transport.balance().catch(() => null), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Whether the sender scope has any message at all (empty page text). */
export async function hasAnyMessage(createdBy: string | null): Promise<boolean> {
  const [row] = await db
    .select({ id: messageBroadcasts.id })
    .from(messageBroadcasts)
    .where(createdBy ? eq(messageBroadcasts.createdBy, createdBy) : undefined)
    .limit(1);
  return !!row;
}
