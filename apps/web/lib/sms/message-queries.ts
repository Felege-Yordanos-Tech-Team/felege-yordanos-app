/**
 * Database side of SMS broadcasts: who would receive one (the expected people
 * of lib/expected-people.ts with their phones, or the chosen people of
 * audience 'selected' and the search for them), creating a broadcast with its
 * frozen recipients and deliveries, and the history.
 *
 * Phone numbers never leave the server unmasked.
 */
import 'server-only';
import { and, asc, desc, eq, gte, inArray, sql, type SQL } from 'drizzle-orm';
import {
  authUsers,
  db,
  events,
  members,
  memberTypes,
  messageBroadcasts,
  messageBroadcastTargets,
  messageDeliveries,
  messageRecipients,
  preMembers,
  profiles,
  type BroadcastAudience,
  type BroadcastOrigin,
  type BroadcastStatus,
  type RecipientStatus,
} from '@felege-yordanos/db/server';
import type { Audience, PersonKind } from '../audience';
import { todayYmd } from '../events';
import { loadExpectedPeople } from '../expected-people';
import {
  selectRecipients,
  type Candidate,
  type Selection,
} from './message-audience';
import { maskPhone, pickPhone } from './phone';
import {
  escapeLike,
  personOption,
  SEARCH_LIMIT,
  type PersonOption,
  type TargetRef,
} from './selected-people';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = Tx | typeof db;

/**
 * The people of an audience (same rule as an event with that audience), with
 * their phones, opt-out and, for members, the member type (SMS leaves child
 * members out; the expected people themselves are unchanged).
 */
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
            memberType: memberTypes.name,
          })
          .from(members)
          .leftJoin(memberTypes, eq(memberTypes.id, members.memberTypeId))
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
        memberType: r?.memberType ?? null,
      };
    }
    const r = preById.get(e.id);
    return { ...e, phones: [r?.phone ?? null], optOut: r?.optOut ?? false };
  });
}

/* ─── Audience 'selected' ────────────────────────────────── */

const memberCandidateCols = {
  id: members.id,
  code: members.memberId,
  name: members.name,
  fatherName: members.fatherName,
  phone: members.addressPhone,
  phoneTwo: members.addressPhoneTwo,
  optOut: members.smsOptOut,
  memberType: memberTypes.name,
  status: members.status,
};
const preCandidateCols = {
  id: preMembers.id,
  code: preMembers.code,
  name: preMembers.name,
  fatherName: preMembers.fatherName,
  phone: preMembers.phone,
  optOut: preMembers.smsOptOut,
  status: preMembers.status,
};

type MemberCandidateRow = {
  id: number;
  code: string;
  name: string;
  fatherName: string;
  phone: string | null;
  phoneTwo: string | null;
  optOut: boolean;
  memberType: string | null;
  status: string | null;
};
type PreCandidateRow = {
  id: number;
  code: string | null;
  name: string;
  fatherName: string;
  phone: string | null;
  optOut: boolean;
  status: string;
};

const memberCandidate = (r: MemberCandidateRow): Candidate => ({
  kind: 'member',
  id: r.id,
  code: r.code,
  name: r.name,
  fatherName: r.fatherName,
  phones: [r.phone, r.phoneTwo],
  optOut: r.optOut,
  memberType: r.memberType,
  active: r.status === 'Active',
});
const preCandidate = (r: PreCandidateRow): Candidate => ({
  kind: 'pre_member',
  id: r.id,
  code: r.code ?? '',
  name: r.name,
  fatherName: r.fatherName,
  phones: [r.phone],
  optOut: r.optOut,
  active: r.status === 'active',
});

/** The chosen people as they are now (active or not), by name. */
export async function loadTargetCandidates(
  refs: TargetRef[],
  exec: Executor = db,
): Promise<Candidate[]> {
  const memberIds = refs.filter((r) => r.kind === 'member').map((r) => r.id);
  const preIds = refs.filter((r) => r.kind === 'pre_member').map((r) => r.id);
  const [memberRows, preRows] = await Promise.all([
    memberIds.length
      ? exec
          .select(memberCandidateCols)
          .from(members)
          .leftJoin(memberTypes, eq(memberTypes.id, members.memberTypeId))
          .where(inArray(members.id, memberIds))
      : Promise.resolve([]),
    preIds.length
      ? exec
          .select(preCandidateCols)
          .from(preMembers)
          .where(inArray(preMembers.id, preIds))
      : Promise.resolve([]),
  ]);
  return [...memberRows.map(memberCandidate), ...preRows.map(preCandidate)].sort(
    (a, b) => a.name.localeCompare(b.name) || a.fatherName.localeCompare(b.fatherName),
  );
}

/** The people chosen for a broadcast (audience 'selected'). */
export async function loadBroadcastTargets(
  exec: Executor,
  broadcastId: string,
): Promise<TargetRef[]> {
  const rows = await exec
    .select({
      memberId: messageBroadcastTargets.memberId,
      preMemberId: messageBroadcastTargets.preMemberId,
    })
    .from(messageBroadcastTargets)
    .where(eq(messageBroadcastTargets.broadcastId, broadcastId))
    .orderBy(asc(messageBroadcastTargets.id));
  return rows.map((r) =>
    r.memberId !== null
      ? { kind: 'member' as const, id: r.memberId }
      : { kind: 'pre_member' as const, id: r.preMemberId ?? 0 },
  );
}

/** The people chosen for a broadcast, for the picker and the detail page. */
export async function loadTargetOptions(broadcastId: string): Promise<PersonOption[]> {
  const refs = await loadBroadcastTargets(db, broadcastId);
  return (await loadTargetCandidates(refs)).map(personOption);
}

/** Replaces the people chosen for a broadcast, in the caller's transaction. */
export async function replaceTargets(
  tx: Tx,
  broadcastId: string,
  targets: TargetRef[],
): Promise<void> {
  await tx
    .delete(messageBroadcastTargets)
    .where(eq(messageBroadcastTargets.broadcastId, broadcastId));
  if (!targets.length) return;
  await tx.insert(messageBroadcastTargets).values(
    targets.map((t) => ({
      broadcastId,
      memberId: t.kind === 'member' ? t.id : null,
      preMemberId: t.kind === 'pre_member' ? t.id : null,
    })),
  );
}

/**
 * Active members and pre-members whose name, father's name or ID (member ID,
 * pre-member code) contains `text`, by name, at most SEARCH_LIMIT. `kind`
 * and `memberTypeId` narrow it (a member type leaves pre-members out).
 * People who cannot get SMS are included (the picker shows why).
 */
export async function searchPeople(input: {
  text: string;
  kind: PersonKind | null;
  memberTypeId: number | null;
}): Promise<Candidate[]> {
  const pattern = `%${escapeLike(input.text)}%`;
  const like = (col: SQL) => sql`${col} ILIKE ${pattern} ESCAPE '\\'`;
  const wantMembers = input.kind !== 'pre_member';
  const wantPre = input.kind !== 'member' && input.memberTypeId === null;
  const [memberRows, preRows] = await Promise.all([
    wantMembers
      ? db
          .select(memberCandidateCols)
          .from(members)
          .leftJoin(memberTypes, eq(memberTypes.id, members.memberTypeId))
          .where(
            and(
              eq(members.status, 'Active'),
              input.memberTypeId !== null
                ? eq(members.memberTypeId, input.memberTypeId)
                : undefined,
              sql`(${like(sql`${members.name} || ' ' || ${members.fatherName}`)} OR ${like(sql`${members.memberId}`)})`,
            ),
          )
          .orderBy(asc(members.name), asc(members.fatherName))
          .limit(SEARCH_LIMIT)
      : Promise.resolve([]),
    wantPre
      ? db
          .select(preCandidateCols)
          .from(preMembers)
          .where(
            and(
              eq(preMembers.status, 'active'),
              sql`(${like(sql`${preMembers.name} || ' ' || ${preMembers.fatherName}`)} OR ${like(sql`coalesce(${preMembers.code}, '')`)})`,
            ),
          )
          .orderBy(asc(preMembers.name), asc(preMembers.fatherName))
          .limit(SEARCH_LIMIT)
      : Promise.resolve([]),
  ]);
  return [...memberRows.map(memberCandidate), ...preRows.map(preCandidate)]
    .sort((a, b) => a.name.localeCompare(b.name) || a.fatherName.localeCompare(b.fatherName))
    .slice(0, SEARCH_LIMIT);
}

/** Member types for the picker's filter. */
export async function loadMemberTypes() {
  return db
    .select({ id: memberTypes.id, name: memberTypes.name })
    .from(memberTypes)
    .orderBy(asc(memberTypes.id));
}

/**
 * Recipients of a broadcast audience; 'event' uses the event's audience,
 * 'selected' the chosen people (`targets`), checked as they are now.
 */
export async function loadSelection(
  audience: BroadcastAudience,
  eventId: string | null,
  targets: TargetRef[] = [],
): Promise<{ selection: Selection; event: EventRef | null } | null> {
  if (audience === 'selected')
    return {
      selection: selectRecipients(await loadTargetCandidates(targets)),
      event: null,
    };
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
    /** Audience 'selected': the chosen people. */
    targets?: TargetRef[];
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
  if (input.targets?.length) await replaceTargets(tx, b.id, input.targets);
  await insertRecipients(tx, b.id, input.parts, input.selection);
  return b.id;
}

/**
 * A manual broadcast to send later: status 'scheduled', no recipients yet
 * (the worker works them out at `scheduledAt`, lib/sms/worker.ts). Audience
 * 'selected' stores the chosen people (checked again then).
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
    targets?: TargetRef[];
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
  if (input.targets?.length) await replaceTargets(tx, b.id, input.targets);
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
  /** Audience 'selected': how many people were chosen. */
  targetCount: number;
  totals: BroadcastTotals;
}

const senderName = sql<string | null>`coalesce(nullif(${profiles.displayName}, ''), ${authUsers.name}, ${authUsers.email})`;

const targetCount = sql<number>`(select count(*)::int from ${messageBroadcastTargets} t where t.broadcast_id = ${messageBroadcasts.id})`;

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
      targetCount,
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
      targetCount,
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
