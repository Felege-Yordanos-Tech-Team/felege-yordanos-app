import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  eatMoment,
  isClockTime,
  sendLaterRefusal,
  TIME_PASSED,
  TIME_TOO_FAR,
} from './schedule';

describe('eatMoment', () => {
  it('is the Addis Ababa date and time (UTC+3)', () => {
    assert.equal(eatMoment('2026-11-20', '16:30').toISOString(), '2026-11-20T13:30:00.000Z');
  });
  it('crosses midnight in UTC for times before 03:00', () => {
    assert.equal(eatMoment('2026-11-20', '02:30').toISOString(), '2026-11-19T23:30:00.000Z');
    assert.equal(eatMoment('2027-01-01', '00:05').toISOString(), '2026-12-31T21:05:00.000Z');
  });
});

describe('isClockTime', () => {
  it('accepts HH:MM and HH:MM:SS', () => {
    assert.ok(isClockTime('09:00'));
    assert.ok(isClockTime('23:55:00'));
    assert.ok(!isClockTime('24:00'));
    assert.ok(!isClockTime('9:00'));
    assert.ok(!isClockTime(''));
  });
});

describe('sendLaterRefusal', () => {
  const now = new Date('2026-11-19T12:00:00Z');
  const inMs = (ms: number) => new Date(now.getTime() + ms);
  const MIN = 60 * 1000;
  const DAY = 24 * 60 * MIN;

  it('refuses the past and less than 2 minutes ahead', () => {
    assert.equal(sendLaterRefusal(inMs(-MIN), now), TIME_PASSED);
    assert.equal(sendLaterRefusal(now, now), TIME_PASSED);
    assert.equal(sendLaterRefusal(inMs(2 * MIN - 1), now), TIME_PASSED);
  });

  it('refuses more than 60 days ahead', () => {
    assert.equal(sendLaterRefusal(inMs(60 * DAY + 1), now), TIME_TOO_FAR);
  });

  it('allows 2 minutes to 60 days ahead', () => {
    assert.equal(sendLaterRefusal(inMs(2 * MIN), now), null);
    assert.equal(sendLaterRefusal(inMs(3 * DAY), now), null);
    assert.equal(sendLaterRefusal(inMs(60 * DAY), now), null);
  });

  it('refuses an invalid date', () => {
    assert.ok(sendLaterRefusal(new Date('nope'), now));
  });
});
