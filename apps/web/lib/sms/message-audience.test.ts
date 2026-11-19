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
      skipped: { no_phone: 1, invalid_phone: 1, opted_out: 1, duplicate_phone: 0 },
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
});
