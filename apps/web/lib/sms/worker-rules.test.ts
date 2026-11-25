import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyOutcome,
  isBroadcastDone,
  nextDelayMs,
  nextPart,
  recoverInterrupted,
  reminderDecision,
  scheduledBroadcastDecision,
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

describe('recovery of interrupted messages', () => {
  const now = new Date('2026-11-19T12:00:00Z');
  const ago = (s: number) => new Date(now.getTime() - s * 1000);
  it('a delivery sending for more than 2 minutes becomes unknown, its person failed', () => {
    assert.deepEqual(recoverInterrupted('sending', ago(121), now), {
      delivery: 'unknown',
      recipient: 'failed',
    });
  });
  it('a delivery sending for 2 minutes or less may still be in flight: left alone', () => {
    assert.equal(recoverInterrupted('sending', ago(5), now), null);
    assert.equal(recoverInterrupted('sending', ago(120), now), null);
  });
  it('only sending deliveries are looked at', () => {
    assert.equal(recoverInterrupted('queued', ago(3600), now), null);
    assert.equal(recoverInterrupted('sent', ago(3600), now), null);
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

describe('scheduledBroadcastDecision', () => {
  const at = new Date('2026-11-20T13:30:00Z');
  const grace = 12 * 3600 * 1000;
  const b = { status: 'scheduled' as const, scheduledAt: at };
  it('waits until its time, then fires', () => {
    assert.equal(scheduledBroadcastDecision(b, new Date('2026-11-20T13:29:59Z'), grace), 'wait');
    assert.equal(scheduledBroadcastDecision(b, at, grace), 'fire');
    assert.equal(scheduledBroadcastDecision(b, new Date('2026-11-21T01:30:00Z'), grace), 'fire');
  });
  it('more than 12 hours late: missed, never sent late', () => {
    assert.equal(
      scheduledBroadcastDecision(b, new Date('2026-11-21T01:30:01Z'), grace),
      'missed',
    );
  });
  it('fires once: anything but scheduled is skipped', () => {
    assert.equal(scheduledBroadcastDecision({ ...b, status: 'queued' }, at, grace), 'skip');
    assert.equal(scheduledBroadcastDecision({ ...b, status: 'cancelled' }, at, grace), 'skip');
    assert.equal(
      scheduledBroadcastDecision({ status: 'scheduled', scheduledAt: null }, at, grace),
      'skip',
    );
  });
});

describe('nextDelayMs', () => {
  it('about one request every 1.1 s, more when asked', () => {
    assert.equal(nextDelayMs({ remaining: 50, waitMs: null }), 1100);
    assert.equal(nextDelayMs({ remaining: null, waitMs: 9000 }), 9000);
    assert.equal(nextDelayMs({ remaining: 1, waitMs: null }), 5000);
  });
});
