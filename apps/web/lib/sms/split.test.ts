import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  estimateCredits,
  isGsm7,
  MAX_PARTS,
  normalizeSmsText,
  signatureSuffix,
  smsLength,
  splitSms,
} from './split';

const SIG = 'FYSS';
const SUFFIX = signatureSuffix(SIG); // "\n\n- FYSS", 8 characters

/** The provider's count for one message with the signature. */
const sent = (part: string) =>
  smsLength(part + SUFFIX, isGsm7(part + SUFFIX) ? 'gsm7' : 'ucs2');

function ok(text: string) {
  const r = splitSms(text, SIG);
  assert.equal(r.ok, true, `expected ok, got ${JSON.stringify(r)}`);
  if (!r.ok) throw new Error('unreachable');
  return r;
}

/** Message text without the "(i/n) " prefix. */
const body = (part: string) => part.replace(/^\(\d\/\d\) /, '');

// A long Amharic reminder like the hand test of 2026-11-18 (three
// numbered messages that arrived in order and read as one reminder).
const HAND_TEST =
  'ፈለገ ዮርዳኖስ ሰ/ት/ቤት፦ የአባላት ወርኃዊ ጉባዔ ቅዳሜ ኅዳር 13 ቀን 2019 ዓ.ም. ' +
  'ከቀኑ 8:00 ሰዓት ጀምሮ በቤተ ክርስቲያኑ አዳራሽ ይካሄዳል። ' +
  'ሁሉም አባላትና ቅድመ አባላት በሰዓቱ እንዲገኙ በአክብሮት እናሳስባለን።';

describe('encoding and length', () => {
  it('detects GSM-7 and counts extension characters twice', () => {
    assert.equal(isGsm7('Hello, world! @£$ {}[]~^|€'), true);
    assert.equal(smsLength('a{b', 'gsm7'), 4);
    assert.equal(smsLength('€', 'gsm7'), 2);
    assert.equal(isGsm7('ሰላም'), false);
    assert.equal(isGsm7('“curly quotes”'), false);
  });

  it('counts UTF-16 code units for UCS-2 (emoji count two)', () => {
    assert.equal(smsLength('ሰላም', 'ucs2'), 3);
    assert.equal(smsLength('🙂', 'ucs2'), 2);
  });

  it('normalises whitespace', () => {
    assert.equal(normalizeSmsText('  a \n\n b\t c  '), 'a b c');
  });

  it('the signature suffix is 8 characters for FYSS', () => {
    assert.equal(SUFFIX.length, 8);
  });
});

describe('splitSms: one message', () => {
  it('a Latin text up to 152 characters is one message without a number', () => {
    const text = 'a'.repeat(152);
    const r = ok(text);
    assert.deepEqual(r.parts, [text]);
    assert.equal(r.encoding, 'gsm7');
    assert.equal(r.limit, 160);
    assert.deepEqual(r.lengths, [160]);
  });

  it('an Amharic text up to 62 characters is one message', () => {
    const text = 'ሰ'.repeat(62);
    const r = ok(text);
    assert.deepEqual(r.parts, [text]);
    assert.equal(r.encoding, 'ucs2');
    assert.deepEqual(r.lengths, [70]);
  });

  it('one character more needs numbered messages', () => {
    const r = ok(`${'ሰ'.repeat(30)} ${'ለ'.repeat(32)}`);
    assert.equal(r.parts.length, 2);
    assert.ok(r.parts[0].startsWith('(1/2) '));
    assert.ok(r.parts[1].startsWith('(2/2) '));
  });

  it('extension characters count twice in the limit', () => {
    // 76 × "{" = 152 septets: exactly at the limit with the signature.
    assert.equal(ok('{'.repeat(76)).parts.length, 1);
    // 77 does not fit one message, and one 154-septet word cannot be cut.
    const r = splitSms('{'.repeat(77), SIG);
    assert.equal(r.ok, false);
  });

  it('a single Amharic character makes the whole text Unicode (70)', () => {
    const latin = 'Reminder: the members meeting is on Saturday at 2 pm.';
    assert.equal(ok(latin).limit, 160);
    const mixed = ok(`${latin} ሰላም`);
    assert.equal(mixed.limit, 70);
    assert.equal(mixed.encoding, 'ucs2');
    for (const p of mixed.parts) assert.ok(sent(p) <= 70);
  });

  it('refuses an empty text', () => {
    assert.deepEqual(splitSms('   \n ', SIG), { ok: false, reason: 'empty' });
  });
});

describe('splitSms: numbered messages', () => {
  it('the hand-test reminder becomes three messages of at most 70 with the signature', () => {
    const r = ok(HAND_TEST);
    assert.equal(r.parts.length, 3);
    r.parts.forEach((p, i) => assert.ok(p.startsWith(`(${i + 1}/3) `)));
    for (const p of r.parts) assert.ok(sent(p) <= 70, `${sent(p)}: ${p}`);
    assert.deepEqual(r.lengths, r.parts.map(sent));
    // Nothing lost or reordered.
    assert.equal(r.parts.map(body).join(' '), normalizeSmsText(HAND_TEST));
  });

  it('never cuts inside a word', () => {
    const r = ok(HAND_TEST);
    const words = new Set(normalizeSmsText(HAND_TEST).split(' '));
    for (const p of r.parts)
      for (const w of body(p).split(' ')) assert.ok(words.has(w), w);
  });

  it('prefers a cut after a sentence end', () => {
    const first = 'ነገ ቅዳሜ የአባላት ወርኃዊ ጉባዔ በአዳራሹ አለ።';
    const second = 'ሁላችሁም አባላት በሰዓቱ እንድትገኙ በአክብሮት እናሳስባለን እግዚአብሔር ይባርካችሁ';
    const r = ok(`${first} ${second}`);
    assert.equal(r.parts.length, 2);
    assert.equal(body(r.parts[0]), first);
    assert.equal(body(r.parts[1]), second);
  });

  it('does not cut after a sentence end that leaves a message less than half full', () => {
    const first = 'ነገ ጉባዔ አለ።'; // 11 characters
    const second = 'ሁላችሁም አባላት በሰዓቱ እንድትገኙ በአክብሮት እናሳስባለን እግዚአብሔር ይባርካችሁ';
    const r = ok(`${first} ${second}`);
    assert.equal(r.parts.length, 2);
    assert.notEqual(body(r.parts[0]), first);
    const [a, b] = r.parts.map((p) => body(p).length);
    assert.ok(Math.abs(a - b) <= 12, `${a} vs ${b}`);
  });

  it('prefers a sentence end in Latin text too', () => {
    const a = 'The members meeting is on Saturday at 2 pm in the main hall of the church.';
    const b = 'Please come on time and bring your member card with you so check-in is quick for everyone.';
    const r = ok(`${a} ${b}`);
    assert.equal(r.parts.length, 2);
    assert.equal(body(r.parts[0]), a);
  });

  it('balances the messages (no short last stub)', () => {
    // Greedy packing would give 56 + a few characters.
    const words = Array.from({ length: 24 }, (_, i) => `ቃ${'ል'.repeat(i % 3)}`);
    const r = ok(words.join(' '));
    assert.equal(r.parts.length, 2);
    const [a, b] = r.parts.map((p) => body(p).length);
    assert.ok(Math.abs(a - b) <= 6, `${a} vs ${b}`);
  });

  it('keeps every message within the limit, exactly at it when needed', () => {
    for (const n of [63, 100, 113, 168, 224, 280]) {
      const text = Array.from({ length: n }, () => 'ሰ')
        .join('')
        .replace(/(.{9})/g, '$1 ')
        .trim();
      const r = splitSms(text, SIG);
      if (!r.ok) continue;
      for (const p of r.parts) assert.ok(sent(p) <= 70, `${n}: ${sent(p)}`);
    }
  });

  it('numbers up to five messages', () => {
    const text = Array.from({ length: 50 }, () => 'ሰላም').join(' '); // 199 characters
    const r = ok(text);
    assert.equal(r.parts.length, 4);
    r.parts.forEach((p, i) => assert.ok(p.startsWith(`(${i + 1}/4) `)));
  });

  it('refuses more than five messages and says how many it would need', () => {
    const text = Array.from({ length: 100 }, () => 'ሰላም').join(' ');
    const r = splitSms(text, SIG);
    assert.equal(r.ok, false);
    if (r.ok || r.reason !== 'too_many_parts') throw new Error('wrong reason');
    assert.ok(r.needed > MAX_PARTS);
    assert.equal(r.needed, 8);
  });

  it('refuses a single word longer than a message', () => {
    const r = splitSms(`ሰላም ${'ሀ'.repeat(57)} ሰላም`, SIG);
    assert.deepEqual(r, { ok: false, reason: 'word_too_long', word: 'ሀ'.repeat(57) });
  });

  it('uses the signature name to count', () => {
    const text = Array.from({ length: 15 }, () => 'ሰላም').join(' '); // 59
    assert.equal(ok(text).parts.length, 1);
    // "\n\n- LONGER NAME" is 15 characters: 59 no longer fits in 70.
    const r = splitSms(text, 'LONGER NAME');
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.parts.length, 2);
      for (const p of r.parts) assert.ok(p.length + 15 <= 70);
    }
  });
});

describe('estimateCredits', () => {
  it('counts Safaricom numbers twice', () => {
    assert.equal(estimateCredits(3, { ethio: 10, safaricom: 2 }), 42);
    assert.equal(estimateCredits(1, { ethio: 0, safaricom: 0 }), 0);
  });
});
