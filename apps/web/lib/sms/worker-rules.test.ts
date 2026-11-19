import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyOutcome,
  isBroadcastDone,
  nextDelayMs,
  nextPart,
  recoverInterrupted,
  reminderDecision,
} from './worker-rules';

const ok = { ok: true as const };
const err = (kind: 'retryable' | 'fatal_for_recipient' | 'pause_broadcast' | 'unknown') => ({
  ok: false as const,
  kind,
});

describe('nextPart: a person’s messages go out in order', () => {
  it('starts with part 1', () => {
    assert.equal(
      nextPart([
        { partNo: 2, status: 'queued' },
        { partNo: 1, status: 'queued' },
      ]),
      1,
    );
  });
  it('part 2 only after part 1 was accepted', () => {
    assert.equal(
      nextPart([
        { partNo: 1, status: 'sending' },
        { partNo: 2, status: 'queued' },
      ]),
      null,
    );
    assert.equal(
      nextPart([
        { partNo: 1, status: 'sent' },
        { partNo: 2, status: 'queued' },
        { partNo: 3, status: 'queued' },
      ]),
      2,
    );
  });
  it('a failed or unknown part stops the later ones', () => {
    assert.equal(
      nextPart([
        { partNo: 1, status: 'failed' },
        { partNo: 2, status: 'queued' },
      ]),
      null,
    );
    assert.equal(
      nextPart([
        { partNo: 1, status: 'sent' },
        { partNo: 2, status: 'unknown' },
        { partNo: 3, status: 'queued' },
      ]),
      null,
    );
  });
  it('nothing left when all were sent', () => {
    assert.equal(nextPart([{ partNo: 1, status: 'sent' }]), null);
  });
});

describe('applyOutcome', () => {
  it('sent: the recipient is done after the last part', () => {
    assert.deepEqual(applyOutcome({ outcome: ok, attempts: 0, partNo: 1, totalParts: 3 }), {
      delivery: 'sent',
      attempts: 1,
      recipient: 'sending',
      pauseBroadcast: false,
    });
    assert.equal(
      applyOutcome({ outcome: ok, attempts: 0, partNo: 3, totalParts: 3 }).recipient,
      'sent',
    );
  });

  it('retryable: once more, then failed', () => {
    const first = applyOutcome({ outcome: err('retryable'), attempts: 0, partNo: 2, totalParts: 3 });
    assert.deepEqual(first, {
      delivery: 'queued',
      attempts: 1,
      recipient: 'sending',
      pauseBroadcast: false,
    });
    const second = applyOutcome({ outcome: err('retryable'), attempts: 1, partNo: 2, totalParts: 3 });
    assert.equal(second.delivery, 'failed');
    assert.equal(second.recipient, 'failed');
  });

  it('fatal for the recipient: failed at once, later parts stay unsent', () => {
    const t = applyOutcome({ outcome: err('fatal_for_recipient'), attempts: 0, partNo: 1, totalParts: 2 });
    assert.equal(t.delivery, 'failed');
    assert.equal(t.recipient, 'failed');
    assert.equal(
      nextPart([
        { partNo: 1, status: t.delivery },
        { partNo: 2, status: 'queued' },
      ]),
      null,
    );
  });

  it('unknown outcome is never resent', () => {
    const t = applyOutcome({ outcome: err('unknown'), attempts: 0, partNo: 1, totalParts: 1 });
    assert.equal(t.delivery, 'unknown');
    assert.equal(t.recipient, 'failed');
  });

  it('account or text errors pause the broadcast, the part waits', () => {
    assert.deepEqual(
      applyOutcome({ outcome: err('pause_broadcast'), attempts: 0, partNo: 1, totalParts: 2 }),
      { delivery: 'queued', attempts: 0, recipient: 'queued', pauseBroadcast: true },
    );
  });
});

describe('startup recovery', () => {
  it('a delivery interrupted mid-request becomes unknown, its person failed', () => {
    assert.deepEqual(recoverInterrupted('sending'), {
      delivery: 'unknown',
      recipient: 'failed',
    });
    assert.equal(recoverInterrupted('queued'), null);
    assert.equal(recoverInterrupted('sent'), null);
  });
  it('a broadcast is done when nobody is left', () => {
    assert.equal(isBroadcastDone(0), true);
    assert.equal(isBroadcastDone(3), false);
  });
});

describe('reminderDecision', () => {
  const due = new Date('2026-11-26T06:00:00Z');
  const grace = 12 * 3600 * 1000;
  const open = { closedAt: null };
  const r = { status: 'scheduled' as const, dueAt: due };
  it('waits until the due time, then fires', () => {
    assert.equal(reminderDecision(r, open, new Date('2026-11-26T05:59:59Z'), grace), 'wait');
    assert.equal(reminderDecision(r, open, new Date('2026-11-26T06:00:00Z'), grace), 'fire');
  });
  it('fires once: a sent reminder is skipped', () => {
    assert.equal(
      reminderDecision({ ...r, status: 'sent' }, open, new Date('2026-11-26T06:01:00Z'), grace),
      'skip',
    );
  });
  it('more than 12 hours late: missed, never sent late', () => {
    assert.equal(reminderDecision(r, open, new Date('2026-11-26T18:00:01Z'), grace), 'missed');
  });
  it('closed or deleted event: cancelled', () => {
    assert.equal(reminderDecision(r, { closedAt: due }, due, grace), 'cancelled');
    assert.equal(reminderDecision(r, null, due, grace), 'cancelled');
  });
});

describe('nextDelayMs', () => {
  it('about one request every 1.1 s, more when asked', () => {
    assert.equal(nextDelayMs({ remaining: 50, waitMs: null }), 1100);
    assert.equal(nextDelayMs({ remaining: null, waitMs: 9000 }), 9000);
    assert.equal(nextDelayMs({ remaining: 1, waitMs: null }), 5000);
  });
});
