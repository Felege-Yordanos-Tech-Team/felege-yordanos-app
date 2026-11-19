import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { classifyError, parseRateHeaders, scrubDigits } from './smshub';

describe('classifyError', () => {
  it('pauses the whole broadcast for account and text errors', () => {
    for (const t of [
      'account_suspended',
      'invalid_api_key',
      'insufficient_credits',
      'kyc_not_approved',
      'ip_not_allowed',
      'message_rejected',
      'message_too_long',
      'signature_too_long',
    ])
      assert.equal(classifyError(400, t), 'pause_broadcast', t);
    assert.equal(classifyError(401, null), 'pause_broadcast');
    assert.equal(classifyError(402, null), 'pause_broadcast');
    assert.equal(classifyError(403, 'whatever'), 'pause_broadcast');
  });

  it('retries only what is safe: 429, 502, 503 and network errors', () => {
    assert.equal(classifyError(429, 'rate_limited'), 'retryable');
    assert.equal(classifyError(502, null), 'retryable');
    assert.equal(classifyError(503, null), 'retryable');
    assert.equal(classifyError(0, 'network_error'), 'retryable');
  });

  it('never retries 400 and 422: the recipient fails', () => {
    assert.equal(classifyError(400, 'invalid_msisdn'), 'fatal_for_recipient');
    assert.equal(classifyError(422, 'unsupported_network'), 'fatal_for_recipient');
  });

  it('other server errors: outcome unknown, never resent', () => {
    assert.equal(classifyError(500, null), 'unknown');
    assert.equal(classifyError(504, null), 'unknown');
  });
});

describe('parseRateHeaders', () => {
  const headers = (h: Record<string, string>) => (n: string) => h[n] ?? null;
  it('uses Retry-After', () => {
    assert.deepEqual(parseRateHeaders(headers({ 'retry-after': '7' })), {
      remaining: null,
      waitMs: 7000,
    });
  });
  it('waits for the reset when nothing is left', () => {
    assert.deepEqual(
      parseRateHeaders(
        headers({ 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '20' }),
      ),
      { remaining: 0, waitMs: 20000 },
    );
    assert.deepEqual(
      parseRateHeaders(
        headers({ 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1800000030' }),
        1_800_000_000_000,
      ),
      { remaining: 0, waitMs: 30000 },
    );
  });
  it('no headers, no wait', () => {
    assert.deepEqual(parseRateHeaders(headers({ 'x-ratelimit-remaining': '41' })), {
      remaining: 41,
      waitMs: null,
    });
  });
});

describe('scrubDigits', () => {
  it('removes phone numbers from provider messages', () => {
    assert.equal(
      scrubDigits('Invalid msisdn 0911234516 for +251 91 123 4516'),
      'Invalid msisdn … for …',
    );
    assert.equal(scrubDigits('Only 3 credits left'), 'Only 3 credits left');
  });
});
