/**
 * Audience 'selected' (#147): SMS to people the sender ticks on the compose
 * page. Pure (lib/sms/message-queries.ts loads the people, the actions call
 * these rules).
 *
 * - At most MAX_SELECTED people; the same person twice counts once.
 * - Only people who can get SMS can be chosen (selectable in
 *   ./message-audience): a forged request with anyone else is refused, not
 *   silently skipped.
 * - When the message goes out (now, or later for a scheduled one) the chosen
 *   people go through selectRecipients like any audience, so recipients +
 *   skipped = chosen, and whoever no longer qualifies by then is skipped
 *   with the usual reason.
 * - The picker never gets a full phone number (personOption masks it).
 */
import type { PersonKind } from '../audience';
import {
  selectable,
  type Candidate,
  type NotSelectableReason,
  type Recipient,
} from './message-audience';
import { maskPhone } from './phone';

export const MAX_SELECTED = 200;
export const SEARCH_MIN_CHARS = 2;
export const SEARCH_LIMIT = 20;

export interface TargetRef {
  kind: PersonKind;
  id: number;
}

/** "m:12" / "p:3", same keys as attendance rows on the client. */
export const targetKey = (t: TargetRef): string =>
  `${t.kind === 'member' ? 'm' : 'p'}:${t.id}`;

/** The chosen people without repeats, in the order first chosen. */
export function uniqueTargets(refs: TargetRef[]): TargetRef[] {
  const seen = new Set<string>();
  const out: TargetRef[] = [];
  for (const r of refs) {
    const key = targetKey(r);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ kind: r.kind, id: r.id });
  }
  return out;
}

/** One person in the picker. `phone` is masked; never the full number. */
export interface PersonOption {
  kind: PersonKind;
  id: number;
  code: string;
  name: string;
  fatherName: string;
  memberType: string | null;
  phone: string | null;
  /** Why they cannot be chosen; null = can be chosen. */
  reason: NotSelectableReason | null;
}

export function personOption(c: Candidate): PersonOption {
  const s = selectable(c);
  const raw = s.ok ? s.phone : (c.phones.find((p) => p?.trim()) ?? null);
  return {
    kind: c.kind,
    id: c.id,
    code: c.code,
    name: c.name,
    fatherName: c.fatherName,
    memberType: c.kind === 'member' ? (c.memberType ?? null) : null,
    phone: raw ? maskPhone(raw) : null,
    reason: s.ok ? null : s.reason,
  };
}

export const TARGET_ERRORS = {
  none: 'Choose at least one person.',
  tooMany: `At most ${MAX_SELECTED} people per message.`,
  notFound: 'Some of the chosen people were not found.',
  notSelectable:
    'Some of the chosen people cannot get SMS. Remove them and try again.',
} as const;

/**
 * Checks the people a sender chose against their records (`found`, loaded
 * by id): at least one, at most MAX_SELECTED, every one exists and can get
 * SMS now. Returns the chosen people without repeats.
 */
export function checkTargets(
  requested: TargetRef[],
  found: Candidate[],
): { ok: true; targets: TargetRef[] } | { ok: false; error: string } {
  const targets = uniqueTargets(requested);
  if (targets.length === 0) return { ok: false, error: TARGET_ERRORS.none };
  if (targets.length > MAX_SELECTED)
    return { ok: false, error: TARGET_ERRORS.tooMany };
  const byKey = new Map(found.map((c) => [targetKey(c), c]));
  for (const t of targets) {
    const c = byKey.get(targetKey(t));
    if (!c) return { ok: false, error: TARGET_ERRORS.notFound };
    if (!selectable(c).ok) return { ok: false, error: TARGET_ERRORS.notSelectable };
  }
  return { ok: true, targets };
}

/** The search text, or null when it is too short to search. */
export function searchText(q: string): string | null {
  const text = q.trim().replace(/\s+/g, ' ');
  return text.length >= SEARCH_MIN_CHARS ? text.slice(0, 100) : null;
}

/** `text` for a LIKE pattern: %, _ and \ match themselves. */
export const escapeLike = (text: string): string =>
  text.replace(/[\\%_]/g, (ch) => `\\${ch}`);

/** The confirm step: the first `n` names and how many more. */
export function confirmNames(
  recipients: Pick<Recipient, 'name' | 'fatherName'>[],
  n = 5,
): { names: string[]; more: number } {
  return {
    names: recipients.slice(0, n).map((r) => `${r.name} ${r.fatherName}`.trim()),
    more: Math.max(0, recipients.length - n),
  };
}
