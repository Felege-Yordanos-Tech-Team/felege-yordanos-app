/**
 * Database side of SMS broadcasts: who would receive one (the expected people
 * of lib/expected-people.ts with their phones), creating a broadcast with its
 * frozen recipients and deliveries, and the history.
 *
 * Phone numbers never leave the server unmasked.
 */
import 'server-only';
import { and, asc, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import {
  authUsers,
  db,
  events,
  members,
  messageBroadcasts,
  messageDeliveries,
  messageRecipients,
  preMembers,
  profiles,
  type BroadcastAudience,
  type BroadcastOrigin,
  type BroadcastStatus,
  type RecipientStatus,
} from '@felege-yordanos/db/server';
import type { Audience } from '../audience';
import { todayYmd } from '../events';
import { loadExpectedPeople } from '../expected-people';
import {
  selectRecipients,
  type Candidate,
  type Selection,
} from './message-audience';
import { maskPhone, pickPhone } from './phone';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** The people of an audience (same rule as an event with that audience). */
export async function loadCandidates(audience: Audience): Promise<Candidate[]> {
  const expected = await loadExpectedPeople({ audience });
  const memberIds = expected.filter((e) => e.kind === 'member').map((e) => e.id);
  const preIds = expected.filter((e) => e.kind === 'pre_member').map((e) => e.id);
  const [memberRows, preRows] = await Promise.all([
    memberIds.length
      ? db
          .select({
            id: members.id,
            phone: members.addressPhone,
            phoneTwo: members.addressPhoneTwo,
            optOut: members.smsOptOut,
          })
          .from(members)
          .where(inArray(members.id, memberIds))
      : Promise.resolve([]),
    preIds.length
      ? db
          .select({
            id: preMembers.id,
            phone: preMembers.phone,
            optOut: preMembers.smsOptOut,
          })
          .from(preMembers)
          .where(inArray(preMembers.id, preIds))
      : Promise.resolve([]),
  ]);
  const memberById = new Map(memberRows.map((r) => [r.id, r]));
  const preById = new Map(preRows.map((r) => [r.id, r]));
  return expected.map((e) => {
    if (e.kind === 'member') {
      const r = memberById.get(e.id);
      return {
        ...e,
        phones: [r?.phone ?? null, r?.phoneTwo ?? null],
        optOut: r?.optOut ?? false,
      };
    }
    const r = preById.get(e.id);
    return { ...e, phones: [r?.phone ?? null], optOut: r?.optOut ?? false };
  });
}

/** Recipients of a broadcast audience; 'event' uses the event's audience. */
export async function loadSelection(
  audience: BroadcastAudience,
  eventId: string | null,
): Promise<{ selection: Selection; event: EventRef | null } | null> {
  let event: EventRef | null = null;
  let peopleAudience: Audience;
  if (audience === 'event') {
    if (!eventId) return null;
    event = await loadEventRef(eventId);
    if (!event) return null;
    peopleAudience = event.audience;
  } else peopleAudience = audience;
  return {
    selection: selectRecipients(await loadCandidates(peopleAudience)),
    event,
  };
}

/** Events the compose page offers (from a month ago on), newest first. */
export async function loadComposeEvents() {
  const from = new Date(Date.now() - 31 * 24 * 3600 * 1000);
  return db
    .select({
      id: events.id,
      title: events.title,
      eventDate: events.eventDate,
      audience: events.audience,
    })
    .from(events)
    .where(gte(events.eventDate, todayYmd(from)))
    .orderBy(desc(events.eventDate))
    .limit(300);
}

export interface EventRef {
  id: string;
  title: string;
  eventDate: string;
  startTime: string | null;
  departmentId: number | null;
  audience: Audience;
  closedAt: Date | null;
}

export async function loadEventRef(id: string): Promise<EventRef | null> {
  const [row] = await db
    .select({
      id: events.id,
      title: events.title,
      eventDate: events.eventDate,
      startTime: events.startTime,
      departmentId: events.departmentId,
      audience: events.audience,
      closedAt: events.closedAt,
    })
    .from(events)
    .where(eq(events.id, id))
    .limit(1);
  return row ?? null;
}

/** The sender's own number (linked member or pre-member record), or null. */
export async function ownPhone(user: {
  id: string;
  memberRecordId: number | null;
  preMemberRecordId: number | null;
}): Promise<string | null> {
  if (user.memberRecordId !== null) {
    const [m] = await db
      .select({ a: members.addressPhone, b: members.addressPhoneTwo })
      .from(members)
      .where(and(eq(members.id, user.memberRecordId), eq(members.authUserId, user.id)))
      .limit(1);
    const picked = pickPhone([m?.a ?? null, m?.b ?? null]);
    if ('phone' in picked) return picked.phone;
  }
  if (user.preMemberRecordId !== null) {
    const [p] = await db
      .select({ phone: preMembers.phone })
      .from(preMembers)
      .where(
        and(eq(preMembers.id, user.preMemberRecordId), eq(preMembers.authUserId, user.id)),
      )
      .limit(1);
    const picked = pickPhone([p?.phone ?? null]);
    if ('phone' in picked) return picked.phone;
  }
  return null;
}

const CHUNK = 500;
const chunks = <T,>(rows: T[]) =>
  Array.from({ length: Math.ceil(rows.length / CHUNK) }, (_, i) =>
    rows.slice(i * CHUNK, (i + 1) * CHUNK),
  );

/**
 * Creates a broadcast with its recipients (and skipped people) and one
 * delivery per recipient and message, in the caller's transaction. Status
 * 'queued': the worker checks the text with the provider, then sends.
 */
export async function insertBroadcast(
  tx: Tx,
  input: {
    text: string;
    parts: string[];
    audience: BroadcastAudience;
    eventId: string | null;
    origin: BroadcastOrigin;
    createdBy: string | null;
    selection: Selection;
  },
): Promise<string> {
  const [b] = await tx
    .insert(messageBroadcasts)
    .values({
      channel: 'sms',
      text: input.text,
      parts: input.parts,
      audience: input.audience,
      eventId: input.eventId,
      origin: input.origin,
      createdBy: input.createdBy,
      status: 'queued',
    })
    .returning({ id: messageBroadcasts.id });
  await insertRecipients(tx, b.id, input.parts, input.selection);
  return b.id;
}

/**
 * A manual broadcast to send later: status 'scheduled', no recipients yet
 * (the worker works them out at `scheduledAt`, lib/sms/worker.ts).
 */
export async function insertScheduledBroadcast(
  tx: Tx,
  input: {
    text: string;
    parts: string[];
    audience: BroadcastAudience;
    eventId: string | null;
    createdBy: string;
    scheduledAt: Date;
  },
): Promise<string> {
  const [b] = await tx
    .insert(messageBroadcasts)
    .values({
      channel: 'sms',
      text: input.text,
      parts: input.parts,
      audience: input.audience,
      eventId: input.eventId,
      origin: 'manual',
      createdBy: input.createdBy,
      status: 'scheduled',
      scheduledAt: input.scheduledAt,
    })
    .returning({ id: messageBroadcasts.id });
  return b.id;
}

/**
 * The recipients (and skipped people) of a broadcast and one delivery per
 * recipient and message, in the caller's transaction.
 */
export async function insertRecipients(
  tx: Tx,
  broadcastId: string,
  parts: string[],
  selection: Selection,
): Promise<void> {
  const ids = (kind: string, id: number) =>
    kind === 'member'
      ? { memberId: id, preMemberId: null }
      : { memberId: null, preMemberId: id };
  const rows = [
    ...selection.recipients.map((r) => ({
      broadcastId,
      ...ids(r.kind, r.id),
      phone: r.phone,
      network: r.network,
      status: 'queued' as const,
    })),
    ...selection.skipped.map((s) => ({
      broadcastId,
      ...ids(s.kind, s.id),
      phone: null,
      network: null,
      status: 'skipped' as const,
      skipReason: s.reason,
    })),
  ];
  for (const part of chunks(rows)) {
    const inserted = await tx
      .insert(messageRecipients)
      .values(part)
      .returning({ id: messageRecipients.id, status: messageRecipients.status });
    const deliveries = inserted
      .filter((r) => r.status === 'queued')
      .flatMap((r) =>
        parts.map((_, i) => ({ recipientId: r.id, partNo: i + 1 })),
      );
    for (const d of chunks(deliveries))
      await tx.insert(messageDeliveries).values(d);
  }
}

/* ─── History ─────────────────────────────────────────────── */

export interface BroadcastTotals {
  queued: number;
  sending: number;
  sent: number;
  failed: number;
  skipped: number;
}

const totalsSql = {
  queued: sql<number>`count(*) filter (where ${messageRecipients.status} = 'queued')::int`,
  sending: sql<number>`count(*) filter (where ${messageRecipients.status} = 'sending')::int`,
  sent: sql<number>`count(*) filter (where ${messageRecipients.status} = 'sent')::int`,
  failed: sql<number>`count(*) filter (where ${messageRecipients.status} = 'failed')::int`,
  skipped: sql<number>`count(*) filter (where ${messageRecipients.status} = 'skipped')::int`,
};

export interface BroadcastListItem {
  id: string;
  channel: string;
  text: string;
  partsCount: number;
  audience: BroadcastAudience;
  eventTitle: string | null;
  origin: BroadcastOrigin;
  status: BroadcastStatus;
  pauseReason: string | null;
  createdAt: Date;
  /** Status 'scheduled' (and missed): when it goes out. */
  scheduledAt: Date | null;
  createdBy: string | null;
  senderName: string | null;
  totals: BroadcastTotals;
}

const senderName = sql<string | null>`coalesce(nullif(${profiles.displayName}, ''), ${authUsers.name}, ${authUsers.email})`;

/** Broadcasts newest first; `createdBy` limits to one sender (null = all). */
export async function listBroadcasts(
  createdBy: string | null,
  limit = 100,
): Promise<BroadcastListItem[]> {
  const rows = await db
    .select({
      id: messageBroadcasts.id,
      channel: messageBroadcasts.channel,
      text: messageBroadcasts.text,
      parts: messageBroadcasts.parts,
      audience: messageBroadcasts.audience,
      eventTitle: events.title,
      origin: messageBroadcasts.origin,
      status: messageBroadcasts.status,
      pauseReason: messageBroadcasts.pauseReason,
      createdAt: messageBroadcasts.createdAt,
      scheduledAt: messageBroadcasts.scheduledAt,
      createdBy: messageBroadcasts.createdBy,
      senderName,
    })
    .from(messageBroadcasts)
    .leftJoin(events, eq(events.id, messageBroadcasts.eventId))
    .leftJoin(profiles, eq(profiles.id, messageBroadcasts.createdBy))
    .leftJoin(authUsers, eq(authUsers.id, messageBroadcasts.createdBy))
    .where(createdBy ? eq(messageBroadcasts.createdBy, createdBy) : undefined)
    .orderBy(desc(messageBroadcasts.createdAt))
    .limit(limit);
  const totals = await totalsFor(rows.map((r) => r.id));
  return rows.map(({ parts, ...r }) => ({
    ...r,
    partsCount: parts.length,
    totals: totals.get(r.id) ?? emptyTotals(),
  }));
}

const emptyTotals = (): BroadcastTotals => ({
  queued: 0,
  sending: 0,
  sent: 0,
  failed: 0,
  skipped: 0,
});

async function totalsFor(ids: string[]) {
  const map = new Map<string, BroadcastTotals>();
  if (!ids.length) return map;
  const rows = await db
    .select({ broadcastId: messageRecipients.broadcastId, ...totalsSql })
    .from(messageRecipients)
    .where(inArray(messageRecipients.broadcastId, ids))
    .groupBy(messageRecipients.broadcastId);
  for (const { broadcastId, ...t } of rows) map.set(broadcastId, t);
  return map;
}

export async function loadBroadcast(id: string) {
  const [row] = await db
    .select({
      id: messageBroadcasts.id,
      channel: messageBroadcasts.channel,
      text: messageBroadcasts.text,
      parts: messageBroadcasts.parts,
      audience: messageBroadcasts.audience,
      eventId: messageBroadcasts.eventId,
      eventTitle: events.title,
      eventDate: events.eventDate,
      origin: messageBroadcasts.origin,
      status: messageBroadcasts.status,
      pauseReason: messageBroadcasts.pauseReason,
      createdAt: messageBroadcasts.createdAt,
      scheduledAt: messageBroadcasts.scheduledAt,
      startedAt: messageBroadcasts.startedAt,
      finishedAt: messageBroadcasts.finishedAt,
      createdBy: messageBroadcasts.createdBy,
      senderName,
    })
    .from(messageBroadcasts)
    .leftJoin(events, eq(events.id, messageBroadcasts.eventId))
    .leftJoin(profiles, eq(profiles.id, messageBroadcasts.createdBy))
    .leftJoin(authUsers, eq(authUsers.id, messageBroadcasts.createdBy))
    .where(eq(messageBroadcasts.id, id))
    .limit(1);
  if (!row) return null;
  const totals = (await totalsFor([row.id])).get(row.id) ?? emptyTotals();
  return { ...row, totals };
}

export interface RecipientRow {
  id: number;
  kind: 'member' | 'pre_member';
  personId: number;
  code: string;
  name: string;
  /** Masked: "09** *** *16". */
  phone: string | null;
  network: string | null;
  status: RecipientStatus;
  skipReason: string | null;
  partsSent: number;
  /** Error of the last failed or unknown message, if any. */
  errorType: string | null;
}

/** Recipients of a broadcast, by name, with masked numbers. */
export async function loadRecipients(broadcastId: string): Promise<RecipientRow[]> {
  const rows = await db
    .select({
      id: messageRecipients.id,
      memberId: messageRecipients.memberId,
      preMemberId: messageRecipients.preMemberId,
      memberCode: members.memberId,
      memberName: members.name,
      memberFather: members.fatherName,
      preCode: preMembers.code,
      preName: preMembers.name,
      preFather: preMembers.fatherName,
      phone: messageRecipients.phone,
      network: messageRecipients.network,
      status: messageRecipients.status,
      skipReason: messageRecipients.skipReason,
      partsSent: sql<number>`(select count(*)::int from ${messageDeliveries} d where d.recipient_id = ${messageRecipients.id} and d.status = 'sent')`,
      errorType: sql<string | null>`(select d.error_type from ${messageDeliveries} d where d.recipient_id = ${messageRecipients.id} and d.status in ('failed', 'unknown') order by d.part_no limit 1)`,
    })
    .from(messageRecipients)
    .leftJoin(members, eq(members.id, messageRecipients.memberId))
    .leftJoin(preMembers, eq(preMembers.id, messageRecipients.preMemberId))
    .where(eq(messageRecipients.broadcastId, broadcastId))
    .orderBy(asc(sql`coalesce(${members.name}, ${preMembers.name})`));
  return rows.map((r) => {
    const isMember = r.memberId !== null;
    return {
      id: r.id,
      kind: isMember ? 'member' : 'pre_member',
      personId: (isMember ? r.memberId : r.preMemberId) ?? 0,
      code: (isMember ? r.memberCode : r.preCode) ?? '',
      name: [isMember ? r.memberName : r.preName, isMember ? r.memberFather : r.preFather]
        .filter(Boolean)
        .join(' '),
      phone: r.phone ? maskPhone(r.phone) : null,
      network: r.network,
      status: r.status,
      skipReason: r.skipReason,
      partsSent: r.partsSent,
      errorType: r.errorType,
    };
  });
}
