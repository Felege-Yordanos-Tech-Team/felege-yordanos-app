import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { selectable, selectRecipients, summarize, type Candidate } from './message-audience';
import {
  checkTargets,
  confirmNames,
  escapeLike,
  MAX_SELECTED,
  personOption,
  searchText,
  TARGET_ERRORS,
  uniqueTargets,
} from './selected-people';

const m = (id: number, phones: (string | null)[], over: Partial<Candidate> = {}): Candidate => ({
  kind: 'member',
  id,
  code: `ssu/01/03/05/${String(id).padStart(5, '0')}`,
  name: `Member${id}`,
  fatherName: 'F',
  phones,
  optOut: false,
  memberType: 'Regular',
  active: true,
  ...over,
});
const p = (id: number, phone: string | null, over: Partial<Candidate> = {}): Candidate => ({
  kind: 'pre_member',
  id,
  code: `FYP-2019-${String(id).padStart(4, '0')}`,
  name: `Pre${id}`,
  fatherName: 'F',
  phones: [phone],
  optOut: false,
  active: true,
  ...over,
});

describe('selectable', () => {
  it('accepts an active adult with a mobile number and gives the number', () => {
    assert.deepEqual(selectable(m(1, [null, '+251 911 000 001'])), { ok: true, phone: '0911000001' });
    assert.deepEqual(selectable(p(1, '0711000101')), { ok: true, phone: '0711000101' });
    // No member type = adult; missing `active` = active.
    assert.equal(selectable(m(2, ['0911000002'], { memberType: null, active: undefined })).ok, true);
  });

  it('gives the reason for each person who cannot get SMS', () => {
    const reason = (c: Candidate) => {
      const s = selectable(c);
      return s.ok ? null : s.reason;
    };
    assert.equal(reason(m(1, ['0911000001'], { active: false })), 'inactive');
    assert.equal(reason(p(1, '0911000101', { active: false })), 'inactive');
    assert.equal(reason(m(2, ['0911000002'], { memberType: 'Regular_Youth' })), 'child_member');
    assert.equal(reason(m(3, ['0911000003'], { optOut: true })), 'opted_out');
    assert.equal(reason(p(2, '0911000102', { optOut: true })), 'opted_out');
    assert.equal(reason(m(4, [null, ' '])), 'no_phone');
    assert.equal(reason(p(3, null)), 'no_phone');
    assert.equal(reason(m(5, ['0111234567', null])), 'invalid_phone');
  });

  it('checks in order: inactive, child, opted out, phone', () => {
    const s = selectable(m(1, [null], { active: false, memberType: 'Regular_Youth', optOut: true }));
    assert.deepEqual(s, { ok: false, reason: 'inactive' });
    const c = selectable(m(2, [null], { memberType: 'Regular_Youth', optOut: true }));
    assert.deepEqual(c, { ok: false, reason: 'child_member' });
    // Pre-members have no member type: never a child member.
    assert.equal(selectable(p(4, '0911000104', { memberType: 'Regular_Youth' })).ok, true);
  });
});

describe('uniqueTargets', () => {
  it('drops repeats and keeps the first order; a member and a pre-member with the same id differ', () => {
    assert.deepEqual(
      uniqueTargets([
        { kind: 'member', id: 2 },
        { kind: 'pre_member', id: 2 },
        { kind: 'member', id: 2 },
        { kind: 'member', id: 1 },
      ]),
      [
        { kind: 'member', id: 2 },
        { kind: 'pre_member', id: 2 },
        { kind: 'member', id: 1 },
      ],
    );
  });
});

describe('checkTargets', () => {
  const people = [m(1, ['0911000001']), m(2, ['0911000002']), p(1, '0911000101')];

  it('accepts selectable people that exist, without repeats', () => {
    const res = checkTargets(
      [
        { kind: 'member', id: 1 },
        { kind: 'pre_member', id: 1 },
        { kind: 'member', id: 1 },
      ],
      people,
    );
    assert.deepEqual(res, {
      ok: true,
      targets: [
        { kind: 'member', id: 1 },
        { kind: 'pre_member', id: 1 },
      ],
    });
  });

  it('refuses an empty selection', () => {
    assert.deepEqual(checkTargets([], people), { ok: false, error: TARGET_ERRORS.none });
  });

  it(`allows ${MAX_SELECTED} people and refuses ${MAX_SELECTED + 1}`, () => {
    const many = Array.from({ length: MAX_SELECTED + 1 }, (_, i) =>
      m(i + 1, [`09${String(10000000 + i)}`]),
    );
    const refs = many.map((c) => ({ kind: c.kind, id: c.id }));
    assert.equal(checkTargets(refs.slice(0, MAX_SELECTED), many).ok, true);
    assert.deepEqual(checkTargets(refs, many), { ok: false, error: TARGET_ERRORS.tooMany });
    // Repeats do not count towards the limit.
    assert.equal(checkTargets([...refs.slice(0, MAX_SELECTED), refs[0]], many).ok, true);
  });

  it('refuses ids that do not exist (or are of the other kind)', () => {
    assert.deepEqual(checkTargets([{ kind: 'member', id: 99 }], people), {
      ok: false,
      error: TARGET_ERRORS.notFound,
    });
    assert.deepEqual(checkTargets([{ kind: 'pre_member', id: 2 }], people), {
      ok: false,
      error: TARGET_ERRORS.notFound,
    });
  });

  it('refuses a forged request with someone who cannot get SMS', () => {
    for (const bad of [
      m(5, ['0911000005'], { memberType: 'Regular_Youth' }),
      m(6, ['0911000006'], { optOut: true }),
      m(7, [null, null]),
      p(8, '0911000108', { active: false }),
    ]) {
      const res = checkTargets(
        [
          { kind: 'member', id: 1 },
          { kind: bad.kind, id: bad.id },
        ],
        [...people, bad],
      );
      assert.deepEqual(res, { ok: false, error: TARGET_ERRORS.notSelectable }, bad.name);
    }
  });
});

describe("audience 'selected' when it goes out", () => {
  it('recipients + skipped = the chosen people, one recipient per number', () => {
    const chosen = [
      m(1, ['0911000001']),
      m(2, ['0911000001']), // same number as member 1
      p(1, '0911000001'), // same number again: the members come first
      p(2, '0711000102'),
      m(3, ['0911000003']),
    ];
    const s = selectRecipients(chosen);
    assert.equal(s.recipients.length + s.skipped.length, chosen.length);
    assert.deepEqual(
      s.recipients.map((r) => [r.kind, r.id]),
      [
        ['member', 1],
        ['member', 3],
        ['pre_member', 2],
      ],
    );
    assert.deepEqual(
      s.skipped.map((x) => [x.kind, x.id, x.reason]),
      [
        ['member', 2, 'duplicate_phone'],
        ['pre_member', 1, 'duplicate_phone'],
      ],
    );
  });

  it('skips with the right reason whoever changed between scheduling and sending', () => {
    // Chosen when all five could get SMS; checked again when it goes out.
    const atSend = [
      m(1, ['0911000001']),
      m(2, ['0911000002'], { memberType: 'Regular_Youth' }), // became a child member
      m(3, ['0911000003'], { optOut: true }), // turned SMS off
      m(4, [null, null]), // lost their number
      p(1, '0911000101', { active: false }), // withdrawn
    ];
    const s = selectRecipients(atSend);
    assert.deepEqual(s.recipients.map((r) => r.id), [1]);
    assert.deepEqual(
      Object.fromEntries(s.skipped.map((x) => [`${x.kind}:${x.id}`, x.reason])),
      {
        'member:2': 'child_member',
        'member:3': 'opted_out',
        'member:4': 'no_phone',
        'pre_member:1': 'inactive',
      },
    );
    assert.deepEqual(summarize(s).skipped, {
      inactive: 1,
      child_member: 1,
      no_phone: 1,
      invalid_phone: 0,
      opted_out: 1,
      duplicate_phone: 0,
    });
  });
});

describe('personOption', () => {
  it('masks the number and says why someone cannot be chosen', () => {
    assert.deepEqual(personOption(m(1, [null, '+251911000001'])), {
      kind: 'member',
      id: 1,
      code: 'ssu/01/03/05/00001',
      name: 'Member1',
      fatherName: 'F',
      memberType: 'Regular',
      phone: '09** *** *01',
      reason: null,
    });
    const child = personOption(m(2, ['0911000002'], { memberType: 'Regular_Youth' }));
    assert.equal(child.reason, 'child_member');
    assert.equal(child.phone, '09** *** *02');
    assert.equal(personOption(p(1, null)).phone, null);
    assert.equal(personOption(p(1, null)).memberType, null);
    // Never the full number, even when it is not a mobile number.
    const landline = personOption(m(3, ['011 123 4567']));
    assert.equal(landline.reason, 'invalid_phone');
    assert.ok(!landline.phone?.includes('1234567'));
  });
});

describe('searchText and escapeLike', () => {
  it('needs at least 2 characters and collapses spaces', () => {
    assert.equal(searchText(' a '), null);
    assert.equal(searchText('  አበበ   በቀለ '), 'አበበ በቀለ');
    assert.equal(searchText('x'.repeat(300))?.length, 100);
  });

  it('makes %, _ and \\ match themselves', () => {
    assert.equal(escapeLike('50%_a\\b'), '50\\%\\_a\\\\b');
    assert.equal(escapeLike('ssu/01/03'), 'ssu/01/03');
  });
});

describe('confirmNames', () => {
  it('lists the first five names and how many more', () => {
    const r = Array.from({ length: 7 }, (_, i) => ({ name: `N${i}`, fatherName: 'F' }));
    assert.deepEqual(confirmNames(r), { names: ['N0 F', 'N1 F', 'N2 F', 'N3 F', 'N4 F'], more: 2 });
    assert.deepEqual(confirmNames(r.slice(0, 2)), { names: ['N0 F', 'N1 F'], more: 0 });
  });
});
