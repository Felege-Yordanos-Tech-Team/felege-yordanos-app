import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { maskPhone, networkOf, normalizePhone, pickPhone } from './phone';

describe('normalizePhone', () => {
  it('accepts the forms SMSHub accepts and returns 09… / 07…', () => {
    for (const raw of [
      '0911234516',
      '911234516',
      '251911234516',
      '+251911234516',
      '00251911234516',
      '+251 91 123 4516',
      '091-123-4516',
      '(091) 123.4516',
    ])
      assert.equal(normalizePhone(raw), '0911234516', raw);
    assert.equal(normalizePhone('+251 712 345 678'), '0712345678');
  });

  it('rejects landlines, other countries and junk', () => {
    for (const raw of [
      '0111234567', // Addis landline
      '+254712345678', // Kenya
      '091123451',
      '09112345167',
      'abc',
      '',
      null,
      undefined,
    ])
      assert.equal(normalizePhone(raw), null, String(raw));
  });

  it('networkOf', () => {
    assert.equal(networkOf('0911234516'), 'ethio');
    assert.equal(networkOf('0712345678'), 'safaricom');
  });
});

describe('maskPhone', () => {
  it('shows the first two and last two digits only', () => {
    assert.equal(maskPhone('0911234516'), '09** *** *16');
    assert.equal(maskPhone('+251911234516'), '09** *** *16');
    assert.equal(maskPhone(null), '—');
  });
});

describe('pickPhone', () => {
  it('takes the first usable number', () => {
    assert.deepEqual(pickPhone(['0111234567', '0911234516']), {
      phone: '0911234516',
    });
  });
  it('tells no phone from an unusable one', () => {
    assert.deepEqual(pickPhone([null, '  ']), { skip: 'no_phone' });
    assert.deepEqual(pickPhone(['0111234567', null]), { skip: 'invalid_phone' });
  });
});
