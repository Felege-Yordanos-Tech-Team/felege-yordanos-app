/**
 * Who gets an SMS broadcast. Pure: lib/sms/message-queries.ts loads the
 * people (the expected people of lib/expected-people.ts, same rule as the
 * check-in list) with their phones and opt-out, this module picks the
 * recipients.
 *
 * - Child members (member type in SMS_EXCLUDED_MEMBER_TYPES, the register's
 *   "ህጻናት መደበኛ"): skipped ('child_member'), checked first so a child is
 *   always counted as a child. No type = adult. Pre-members are never
 *   affected. They stay expected at events; only SMS leaves them out.
 * - Opted out of SMS: skipped ('opted_out').
 * - No phone, or nothing that is a mobile number: skipped ('no_phone',
 *   'invalid_phone').
 * - One recipient per phone number: a second person with the same number is
 *   skipped ('duplicate_phone'); members come before pre-members.
 */
import type { PersonKind } from '../audience';
import { networkOf, pickPhone, type Network } from './phone';

export const MESSAGE_AUDIENCES = [
  'members',
  'pre_members',
  'everyone',
  'event',
] as const;
export type MessageAudience = (typeof MESSAGE_AUDIENCES)[number];

/** Member types (member_types.name) that never get SMS. */
export const SMS_EXCLUDED_MEMBER_TYPES: readonly string[] = ['Regular_Youth'];

export const SKIP_REASONS = [
  'child_member',
  'no_phone',
  'invalid_phone',
  'opted_out',
  'duplicate_phone',
] as const;
export type SkipReason = (typeof SKIP_REASONS)[number];

export interface Candidate {
  kind: PersonKind;
  id: number;
  code: string;
  name: string;
  fatherName: string;
  /** Phone fields in order of preference (members have two). */
  phones: (string | null)[];
  optOut: boolean;
  /** member_types.name of a member; null or missing = no type (adult). */
  memberType?: string | null;
}

export interface Recipient {
  kind: PersonKind;
  id: number;
  code: string;
  name: string;
  fatherName: string;
  phone: string;
  network: Network;
}

export interface Skipped {
  kind: PersonKind;
  id: number;
  code: string;
  name: string;
  fatherName: string;
  reason: SkipReason;
}

export interface Selection {
  recipients: Recipient[];
  skipped: Skipped[];
}

const byName = (a: { name: string; fatherName: string }, b: typeof a) =>
  a.name.localeCompare(b.name) || a.fatherName.localeCompare(b.fatherName);

export function selectRecipients(candidates: Candidate[]): Selection {
  const recipients: Recipient[] = [];
  const skipped: Skipped[] = [];
  const seenPhones = new Set<string>();
  const seenPeople = new Set<string>();
  // Members first, so a shared number goes to the member.
  const ordered = [...candidates].sort(
    (a, b) =>
      (a.kind === b.kind ? 0 : a.kind === 'member' ? -1 : 1) || byName(a, b),
  );
  for (const c of ordered) {
    const key = `${c.kind}:${c.id}`;
    if (seenPeople.has(key)) continue;
    seenPeople.add(key);
    const person = {
      kind: c.kind,
      id: c.id,
      code: c.code,
      name: c.name,
      fatherName: c.fatherName,
    };
    if (
      c.kind === 'member' &&
      c.memberType != null &&
      SMS_EXCLUDED_MEMBER_TYPES.includes(c.memberType)
    ) {
      skipped.push({ ...person, reason: 'child_member' });
      continue;
    }
    if (c.optOut) {
      skipped.push({ ...person, reason: 'opted_out' });
      continue;
    }
    const picked = pickPhone(c.phones);
    if ('skip' in picked) {
      skipped.push({ ...person, reason: picked.skip });
      continue;
    }
    if (seenPhones.has(picked.phone)) {
      skipped.push({ ...person, reason: 'duplicate_phone' });
      continue;
    }
    seenPhones.add(picked.phone);
    recipients.push({
      ...person,
      phone: picked.phone,
      network: networkOf(picked.phone),
    });
  }
  return {
    recipients: recipients.sort(byName),
    skipped: skipped.sort(byName),
  };
}

/** Counts for the compose page (no names, no numbers). */
export interface SelectionSummary {
  recipients: number;
  ethio: number;
  safaricom: number;
  skipped: Record<SkipReason, number>;
}

export function summarize(selection: Selection): SelectionSummary {
  const skipped = Object.fromEntries(SKIP_REASONS.map((r) => [r, 0])) as Record<
    SkipReason,
    number
  >;
  for (const s of selection.skipped) skipped[s.reason] += 1;
  const safaricom = selection.recipients.filter(
    (r) => r.network === 'safaricom',
  ).length;
  return {
    recipients: selection.recipients.length,
    ethio: selection.recipients.length - safaricom,
    safaricom,
    skipped,
  };
}
