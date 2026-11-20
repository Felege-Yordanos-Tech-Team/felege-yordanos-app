import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  composeSms,
  estimateCredits,
  isGsm7,
  MAX_PARTS,
  maxSmsLength,
  normalizeSmsText,
  signatureSuffix,
  smsLength,
  smsPartCount,
} from './split';

const SIG = 'FYSS';
const SUFFIX = signatureSuffix(SIG); // "\n\n- FYSS", 8 characters

function ok(text: string, signature = SIG) {
  const r = composeSms(text, signature);
  assert.equal(r.ok, true, `expected ok, got ${JSON.stringify(r)}`);
  if (!r.ok) throw new Error('unreachable');
  return r;
}

/** Parts for a text whose length WITH the signature is `total`. */
const amharic = (total: number) => ok('ሰ'.repeat(total - SUFFIX.length)).smsParts;
const latin = (total: number) => ok('a'.repeat(total - SUFFIX.length)).smsParts;

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

  it('the longest texts are 670 (Unicode) and 1530 (GSM-7)', () => {
    assert.equal(MAX_PARTS, 10);
    assert.equal(maxSmsLength('ucs2'), 670);
    assert.equal(maxSmsLength('gsm7'), 1530);
  });
});

describe('smsPartCount (length already includes the signature)', () => {
  it('Unicode: 70 in one SMS, then 67 per part', () => {
    assert.equal(smsPartCount(0, 'ucs2'), 0);
    assert.equal(smsPartCount(1, 'ucs2'), 1);
    assert.equal(smsPartCount(70, 'ucs2'), 1);
    assert.equal(smsPartCount(71, 'ucs2'), 2);
    assert.equal(smsPartCount(134, 'ucs2'), 2);
    assert.equal(smsPartCount(135, 'ucs2'), 3);
    assert.equal(smsPartCount(670, 'ucs2'), 10);
    assert.equal(smsPartCount(671, 'ucs2'), 11);
  });

  it('GSM-7: 160 in one SMS, then 153 per part', () => {
    assert.equal(smsPartCount(160, 'gsm7'), 1);
    assert.equal(smsPartCount(161, 'gsm7'), 2);
    assert.equal(smsPartCount(306, 'gsm7'), 2);
    assert.equal(smsPartCount(307, 'gsm7'), 3);
    assert.equal(smsPartCount(1530, 'gsm7'), 10);
    assert.equal(smsPartCount(1531, 'gsm7'), 11);
  });
});

describe('composeSms: Amharic boundaries with the signature', () => {
  it('70/71', () => {
    assert.equal(amharic(70), 1);
    assert.equal(amharic(71), 2);
  });
  it('134/135', () => {
    assert.equal(amharic(134), 2);
    assert.equal(amharic(135), 3);
  });
  it('670 is 10 parts, 671 is refused with 1 character to remove', () => {
    assert.equal(amharic(670), 10);
    const r = composeSms('ሰ'.repeat(671 - SUFFIX.length), SIG);
    assert.equal(r.ok, false);
    if (r.ok || r.reason !== 'too_long') throw new Error('wrong reason');
    assert.equal(r.smsParts, 11);
    assert.equal(r.excess, 1);
    assert.equal(r.encoding, 'ucs2');
  });
  it('the signature counts: 70 Amharic characters alone are 2 parts', () => {
    const r = ok('ሰ'.repeat(70));
    assert.equal(r.length, 78);
    assert.equal(r.smsParts, 2);
  });
});

describe('composeSms: GSM-7 boundaries with the signature', () => {
  it('160/161', () => {
    assert.equal(latin(160), 1);
    assert.equal(latin(161), 2);
  });
  it('306/307', () => {
    assert.equal(latin(306), 2);
    assert.equal(latin(307), 3);
  });
  it('1530 is 10 parts, 1531 is refused', () => {
    assert.equal(latin(1530), 10);
    const r = composeSms('a'.repeat(1531 - SUFFIX.length), SIG);
    assert.equal(r.ok, false);
    if (r.ok || r.reason !== 'too_long') throw new Error('wrong reason');
    assert.equal(r.excess, 1);
  });
  it('the signature counts: 160 Latin characters alone are 2 parts', () => {
    assert.equal(ok('a'.repeat(160)).smsParts, 2);
  });
  it('extension characters count twice', () => {
    // 76 × "{" = 152 septets + 8 = 160: one SMS; 77 is two.
    assert.equal(ok('{'.repeat(76)).smsParts, 1);
    assert.equal(ok('{'.repeat(77)).smsParts, 2);
  });
});

describe('composeSms: the message', () => {
  it('one Amharic character switches the whole text to Unicode', () => {
    const text = 'a'.repeat(100);
    const latinOnly = ok(text);
    assert.equal(latinOnly.encoding, 'gsm7');
    assert.equal(latinOnly.smsParts, 1);
    const mixed = ok(`${text} ሰ`);
    assert.equal(mixed.encoding, 'ucs2');
    // 102 + 8 = 110 > 70: two parts of 67.
    assert.equal(mixed.smsParts, 2);
  });

  it('the 236-character announcement (244 with the signature) is 4 parts', () => {
    const words: string[] = [];
    while (words.join(' ').length < 236) words.push('ሰላምታ');
    const text = words.join(' ').slice(0, 236);
    assert.equal(text.length, 236);
    const r = ok(text);
    assert.equal(r.length, 244);
    assert.equal(r.encoding, 'ucs2');
    assert.equal(r.smsParts, 4);
  });

  it('is one message without numbering, the signature appended once', () => {
    const r = ok('  ሰላም   ለሁላችሁ። \n ነገ ጉባዔ አለ። ');
    assert.equal(r.text, 'ሰላም ለሁላችሁ። ነገ ጉባዔ አለ።');
    assert.equal(r.finalText, `${r.text}${SUFFIX}`);
    assert.ok(!/\(\d+\/\d+\)/.test(r.finalText));
  });

  it('uses the signature name to count', () => {
    const text = 'ሰ'.repeat(62);
    assert.equal(ok(text).smsParts, 1);
    // "\n\n- LONGER NAME" is 15 characters: 77 no longer fits in 70.
    assert.equal(ok(text, 'LONGER NAME').smsParts, 2);
  });

  it('refuses an empty text', () => {
    assert.deepEqual(composeSms('   \n ', SIG), { ok: false, reason: 'empty' });
  });
});

describe('estimateCredits', () => {
  it('parts × 1 for Ethio Telecom, parts × 2 for Safaricom', () => {
    assert.equal(estimateCredits(4, { ethio: 1, safaricom: 0 }), 4);
    assert.equal(estimateCredits(4, { ethio: 0, safaricom: 1 }), 8);
    assert.equal(estimateCredits(3, { ethio: 10, safaricom: 2 }), 42);
    assert.equal(estimateCredits(1, { ethio: 0, safaricom: 0 }), 0);
  });
});
