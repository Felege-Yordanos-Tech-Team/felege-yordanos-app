/**
 * The SMS worker's state rules, as pure functions (lib/sms/worker.ts applies
 * them to the database).
 *
 * - A person's messages go out in order: part n+1 only after part n was
 *   accepted ('sent'). A part that fails for good fails the recipient and
 *   leaves their later parts unsent.
 * - A delivery is set to 'sending' and committed before the HTTP call. One
 *   still 'sending' at startup was interrupted mid-request: it becomes
 *   'unknown' and is never sent again (SMSHub has no idempotency key).
 * - Retryable errors (429, 502, 503, timeout) are retried once.
 * - Account or text errors pause the whole broadcast; the part goes back to
 *   'queued' (nothing was sent) and is sent when someone resumes.
 */
import type { ErrorClass } from './smshub';

export const DELIVERY_STATUSES = [
  'queued',
  'sending',
  'sent',
  'failed',
  'unknown',
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const RECIPIENT_STATUSES = [
  'queued',
  'sending',
  'sent',
  'failed',
  'skipped',
] as const;
export type RecipientStatus = (typeof RECIPIENT_STATUSES)[number];

export const BROADCAST_STATUSES = [
  'queued',
  'sending',
  'paused',
  'done',
  'cancelled',
] as const;
export type BroadcastStatus = (typeof BROADCAST_STATUSES)[number];

/** Attempts per message: the first one and one retry. */
export const MAX_ATTEMPTS = 2;

/**
 * The part to send next for one recipient, or null: the first part that is
 * not 'sent', if it is 'queued'. Anything else (sending, failed, unknown)
 * blocks the later parts.
 */
export function nextPart(
  parts: { partNo: number; status: DeliveryStatus }[],
): number | null {
  const sorted = [...parts].sort((a, b) => a.partNo - b.partNo);
  for (const p of sorted) {
    if (p.status === 'sent') continue;
    return p.status === 'queued' ? p.partNo : null;
  }
  return null;
}

export interface Transition {
  delivery: Exclude<DeliveryStatus, 'sending'>;
  /** Attempts to store on the delivery. */
  attempts: number;
  recipient: Exclude<RecipientStatus, 'skipped'>;
  /** The whole broadcast pauses (the error is the account's or the text's). */
  pauseBroadcast: boolean;
}

/**
 * What one send attempt changes. `attempts` is the number of attempts made
 * before this one.
 */
export function applyOutcome(input: {
  outcome: { ok: true } | { ok: false; kind: ErrorClass };
  attempts: number;
  partNo: number;
  totalParts: number;
}): Transition {
  const { outcome, partNo, totalParts } = input;
  const attempts = input.attempts + 1;
  // Still waiting for its first accepted message, or in the middle.
  const inProgress = partNo > 1 ? 'sending' : 'queued';
  if (outcome.ok)
    return {
      delivery: 'sent',
      attempts,
      recipient: partNo >= totalParts ? 'sent' : 'sending',
      pauseBroadcast: false,
    };
  switch (outcome.kind) {
    case 'pause_broadcast':
      // Nothing was sent: the attempt does not count.
      return {
        delivery: 'queued',
        attempts: input.attempts,
        recipient: inProgress,
        pauseBroadcast: true,
      };
    case 'retryable':
      return attempts < MAX_ATTEMPTS
        ? { delivery: 'queued', attempts, recipient: inProgress, pauseBroadcast: false }
        : { delivery: 'failed', attempts, recipient: 'failed', pauseBroadcast: false };
    case 'unknown':
      return { delivery: 'unknown', attempts, recipient: 'failed', pauseBroadcast: false };
    case 'fatal_for_recipient':
      return { delivery: 'failed', attempts, recipient: 'failed', pauseBroadcast: false };
  }
}

/**
 * At startup: a delivery left in 'sending' may or may not have reached the
 * provider. It becomes 'unknown' and its recipient 'failed', never resent.
 */
export const recoverInterrupted = (status: DeliveryStatus) =>
  status === 'sending'
    ? { delivery: 'unknown' as const, recipient: 'failed' as const }
    : null;

/** A broadcast is done when no recipient is still queued or in progress. */
export const isBroadcastDone = (openRecipients: number) => openRecipients === 0;

export type ReminderStatus =
  | 'scheduled'
  | 'sent'
  | 'missed'
  | 'cancelled'
  | 'paused';

/**
 * What the worker does with a reminder now: nothing yet ('wait'), send it
 * ('fire'), skip it as more than 12 hours late ('missed'), or cancel it
 * (event closed or gone). Only 'scheduled' reminders are looked at.
 */
export function reminderDecision(
  reminder: { status: ReminderStatus; dueAt: Date },
  event: { closedAt: Date | null } | null,
  now: Date,
  graceMs: number,
): 'skip' | 'wait' | 'fire' | 'missed' | 'cancelled' {
  if (reminder.status !== 'scheduled') return 'skip';
  if (!event || event.closedAt) return 'cancelled';
  if (now.getTime() < reminder.dueAt.getTime()) return 'wait';
  if (now.getTime() - reminder.dueAt.getTime() > graceMs) return 'missed';
  return 'fire';
}

/** Pause before the next request: ~1.1 s, longer when the provider asks. */
export function nextDelayMs(rate: {
  remaining: number | null;
  waitMs: number | null;
}): number {
  const base = 1100;
  if (rate.waitMs !== null) return Math.max(base, rate.waitMs);
  // Close to the limit (the dashboard shares it): slow down.
  if (rate.remaining !== null && rate.remaining <= 2) return 5000;
  return base;
}
