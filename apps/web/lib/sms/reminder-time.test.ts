import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  defaultReminderText,
  ethiopianClock,
  isMissed,
  reminderDueAt,
  reminderRefusal,
  reminderStatusOnSave,
} from './reminder-time';
import { splitSms } from './split';

describe('reminderDueAt', () => {
  it('is 09:00 Addis Ababa time, N days before the event date', () => {
    assert.equal(
      reminderDueAt('2026-11-28', 2).toISOString(),
      '2026-11-26T06:00:00.000Z',
    );
    assert.equal(
      reminderDueAt('2026-11-28', 0).toISOString(),
      '2026-11-28T06:00:00.000Z',
    );
  });

  it('crosses month and year ends', () => {
    assert.equal(
      reminderDueAt('2027-01-01', 3).toISOString(),
      '2026-12-29T06:00:00.000Z',
    );
    assert.equal(
      reminderDueAt('2028-03-01', 1).toISOString(), // leap year
      '2028-02-29T06:00:00.000Z',
    );
  });

  it('moves with the event date', () => {
    const before = reminderDueAt('2026-11-28', 2);
    const after = reminderDueAt('2026-12-05', 2);
    assert.equal(after.getTime() - before.getTime(), 7 * 24 * 3600 * 1000);
  });
});

describe('missed reminders', () => {
  const due = new Date('2026-11-26T06:00:00Z');
  it('is not missed up to 12 hours late', () => {
    assert.equal(isMissed(due, new Date('2026-11-26T06:00:00Z')), false);
    assert.equal(isMissed(due, new Date('2026-11-26T18:00:00Z')), false);
    assert.equal(isMissed(due, new Date('2026-11-26T18:00:01Z')), true);
  });

  it('a reminder set after its time is missed straight away', () => {
    assert.equal(reminderStatusOnSave(due, new Date('2026-11-26T06:00:01Z')), 'missed');
    assert.equal(reminderStatusOnSave(due, new Date('2026-11-25T20:00:00Z')), 'scheduled');
  });

  it('refuses a reminder that would go out after the event starts', () => {
    // 0 days before an 08:00 event: 09:00 is after the start.
    assert.ok(reminderRefusal({ eventDate: '2026-11-28', startTime: '08:00:00' }, 0));
    assert.equal(
      reminderRefusal({ eventDate: '2026-11-28', startTime: '14:00:00' }, 0),
      null,
    );
    assert.equal(reminderRefusal({ eventDate: '2026-11-28', startTime: null }, 0), null);
  });
});

describe('default reminder text', () => {
  it('uses the Ethiopian clock', () => {
    assert.equal(ethiopianClock('08:30'), 'ከጠዋቱ 2:30 ሰዓት');
    assert.equal(ethiopianClock('14:00'), 'ከቀኑ 8:00 ሰዓት');
    assert.equal(ethiopianClock('12:00'), 'ከቀኑ 6:00 ሰዓት');
    assert.equal(ethiopianClock('18:15'), 'ከምሽቱ 12:15 ሰዓት');
    assert.equal(ethiopianClock('05:00'), 'ከሌሊቱ 11:00 ሰዓት');
  });

  it('names the school, title, weekday, Ethiopian date and time', () => {
    const text = defaultReminderText({
      title: 'የአባላት ወርኃዊ ጉባዔ',
      eventDate: '2026-11-28', // Saturday, ኅዳር 19 2019
      startTime: '14:00:00',
    });
    assert.equal(
      text,
      'ፈለገ ዮርዳኖስ ሰ/ት/ቤት፦ የአባላት ወርኃዊ ጉባዔ፣ ቅዳሜ ኅዳር 19 ቀን 2019 ዓ.ም. ከቀኑ 8:00 ሰዓት ጀምሮ። እንዲገኙ እናሳስባለን።',
    );
    // Fits in at most five SMS.
    assert.equal(splitSms(text, 'FYSS').ok, true);
  });

  it('leaves out the time when the event has none', () => {
    const text = defaultReminderText({
      title: 'ጉባዔ',
      eventDate: '2026-11-28',
      startTime: null,
    });
    assert.ok(!text.includes('ሰዓት'));
    assert.ok(text.startsWith('ፈለገ ዮርዳኖስ'));
  });
});
