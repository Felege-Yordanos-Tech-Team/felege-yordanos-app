import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { expectedPeople } from '../audience';
import { selectRecipients, summarize, type Candidate } from './message-audience';

const m = (id: number, phones: (string | null)[], over: Partial<Candidate> = {}): Candidate => ({
  kind: 'member',
  id,
  code: `9${String(id).padStart(4, '0')}`,
  name: `Member${id}`,
  fatherName: 'F',
  phones,
  optOut: false,
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
  ...over,
});

describe('selectRecipients', () => {
  it('sends to everyone with a usable phone and says why the rest are skipped', () => {
    const s = selectRecipients([
      m(1, ['0911000001', null]),
      m(2, [null, '+251711000002']),
      m(3, [null, null]),
      m(4, ['0111234567', '']),
      m(5, ['0911000005'], { optOut: true }),
      p(1, '0911000101'),
    ]);
    assert.deepEqual(
      s.recipients.map((r) => [r.kind, r.id, r.phone, r.network]),
      [
        ['member', 1, '0911000001', 'ethio'],
        ['member', 2, '0711000002', 'safaricom'],
        ['pre_member', 1, '0911000101', 'ethio'],
      ],
    );
    assert.deepEqual(
      s.skipped.map((x) => [x.id, x.reason]),
      [
        [3, 'no_phone'],
        [4, 'invalid_phone'],
        [5, 'opted_out'],
      ],
    );
    assert.deepEqual(summarize(s), {
      recipients: 3,
      ethio: 2,
      safaricom: 1,
      skipped: { inactive: 0, child_member: 0, no_phone: 1, invalid_phone: 1, opted_out: 1, duplicate_phone: 0 },
    });
  });

  it('one recipient per phone number, the member first', () => {
    const s = selectRecipients([
      p(7, '0911000001', { name: 'Aaa' }),
      m(1, ['0911 000 001'], { name: 'Zzz' }),
      m(2, ['+251911000001'], { name: 'Zzzz' }),
    ]);
    assert.equal(s.recipients.length, 1);
    assert.equal(s.recipients[0].kind, 'member');
    assert.equal(s.recipients[0].id, 1);
    assert.deepEqual(
      s.skipped.map((x) => [x.kind, x.id, x.reason]).sort(),
      [
        ['member', 2, 'duplicate_phone'],
        ['pre_member', 7, 'duplicate_phone'],
      ],
    );
  });

  it('a person listed twice counts once', () => {
    const s = selectRecipients([m(1, ['0911000001']), m(1, ['0911000001'])]);
    assert.equal(s.recipients.length, 1);
    assert.equal(s.skipped.length, 0);
  });
});

describe('child members (Regular_Youth)', () => {
  it('a child with a phone is skipped as child_member', () => {
    const s = selectRecipients([m(1, ['0911000001'], { memberType: 'Regular_Youth' })]);
    assert.equal(s.recipients.length, 0);
    assert.deepEqual(s.skipped.map((x) => [x.id, x.reason]), [[1, 'child_member']]);
  });

  it('a child is counted as a child before any other reason', () => {
    const s = selectRecipients([
      m(1, [null, null], { memberType: 'Regular_Youth' }),
      m(2, ['0111234567'], { memberType: 'Regular_Youth' }),
      m(3, ['0911000003'], { memberType: 'Regular_Youth', optOut: true }),
      m(4, ['0911000099'], { name: 'Aaa' }),
      m(5, ['0911000099'], { name: 'Zzz', memberType: 'Regular_Youth' }),
    ]);
    assert.deepEqual(s.recipients.map((r) => r.id), [4]);
    assert.deepEqual(
      s.skipped.map((x) => [x.id, x.reason]),
      [
        [1, 'child_member'],
        [2, 'child_member'],
        [3, 'child_member'],
        [5, 'child_member'],
      ],
    );
  });

  it('Regular, Special_Regular, Honorary and no type are recipients', () => {
    const s = selectRecipients([
      m(1, ['0911000001'], { memberType: 'Regular' }),
      m(2, ['0911000002'], { memberType: 'Special_Regular' }),
      m(3, ['0911000003'], { memberType: 'Honorary' }),
      m(4, ['0911000004'], { memberType: null }),
      m(5, ['0911000005']),
    ]);
    assert.deepEqual(s.recipients.map((r) => r.id), [1, 2, 3, 4, 5]);
    assert.equal(s.skipped.length, 0);
  });

  it('pre-members are never affected by a member type', () => {
    const s = selectRecipients([p(1, '0911000101', { memberType: 'Regular_Youth' })]);
    assert.deepEqual(s.recipients.map((r) => [r.kind, r.id]), [['pre_member', 1]]);
  });
});

describe('audiences (expected people, lib/audience.ts)', () => {
  const members = [
    { id: 1, code: '90001', name: 'A', fatherName: 'F' },
    { id: 2, code: '90002', name: 'B', fatherName: 'F' },
  ];
  // Active pre-members only: a promoted one is not active any more, so the
  // person is counted once (as the member).
  const preMembers = [{ id: 9, code: 'FYP-2019-0009', name: 'C', fatherName: 'F' }];
  const phoneOf: Record<string, string> = {
    'm:1': '0911000001',
    'm:2': '0911000002',
    'p:9': '0911000009',
  };
  const recipientsFor = (audience: 'members' | 'pre_members' | 'everyone') =>
    selectRecipients(
      expectedPeople(audience, members, preMembers).map((e) => ({
        ...e,
        phones: [phoneOf[e.key]],
        optOut: false,
      })),
    ).recipients.map((r) => `${r.kind}:${r.id}`);

  it('members, pre-members, everyone', () => {
    assert.deepEqual(recipientsFor('members'), ['member:1', 'member:2']);
    assert.deepEqual(recipientsFor('pre_members'), ['pre_member:9']);
    assert.deepEqual(recipientsFor('everyone'), ['member:1', 'member:2', 'pre_member:9']);
  });

  it('children are left out of every audience and counts add up', () => {
    const people = [
      ...members,
      { id: 3, code: '90003', name: 'D', fatherName: 'F' },
      { id: 4, code: '90004', name: 'E', fatherName: 'F' },
    ];
    const typeOf: Record<string, string | null> = {
      'm:1': 'Regular',
      'm:2': null,
      'm:3': 'Regular_Youth',
      'm:4': 'Regular_Youth',
    };
    const phones: Record<string, string | null> = {
      ...phoneOf,
      'm:3': '0911000003',
      'm:4': null,
    };
    for (const audience of ['members', 'pre_members', 'everyone'] as const) {
      const expected = expectedPeople(audience, people, preMembers);
      const s = selectRecipients(
        expected.map((e) => ({
          ...e,
          phones: [phones[e.key] ?? null],
          optOut: false,
          memberType: typeOf[e.key] ?? null,
        })),
      );
      const sum = summarize(s);
      assert.equal(sum.recipients + s.skipped.length, expected.length, audience);
      const children = expected.filter((e) => typeOf[e.key] === 'Regular_Youth').length;
      assert.equal(sum.skipped.child_member, children, audience);
      assert.ok(
        s.recipients.every((r) => typeOf[`m:${r.id}`] !== 'Regular_Youth' || r.kind !== 'member'),
        audience,
      );
    }
  });
});
