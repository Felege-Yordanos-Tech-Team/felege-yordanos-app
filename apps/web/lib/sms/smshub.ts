/**
 * SMSHub (smshub.et) HTTP client and its error rules.
 *
 * No 'server-only' import so the unit tests can load the pure parts
 * (classifyError, parseRateHeaders, scrubDigits); only server code
 * (lib/sms/transport.ts) calls the client. The API key is only read from
 * the environment and never logged.
 *
 * API facts (smshub.et/docs, 2026-11-20): one recipient per request, the
 * whole text in one request (up to 10 SMS parts, joined on the phone,
 * charged per part: credits_used is the total), the provider appends the
 * signature, no idempotency key, 60 requests per minute per account.
 */

export const SMSHUB_BASE_URL = 'https://smshub.et';
const TIMEOUT_MS = 15_000;

/**
 * What to do after a failed request:
 * - retryable: nothing was sent (429, 502, 503, timeout); try once more.
 * - fatal_for_recipient: this number cannot get it (bad number…); the
 *   recipient fails, the broadcast goes on.
 * - pause_broadcast: the account or the text is the problem (no credits,
 *   key, suspended, moderation, too long); every other recipient would fail
 *   too, so the whole broadcast pauses.
 * - unknown: the request may or may not have been sent (other 5xx); never
 *   resent, since there is no idempotency key.
 */
export type ErrorClass =
  | 'retryable'
  | 'fatal_for_recipient'
  | 'pause_broadcast'
  | 'unknown';

/** Error types that stop the whole broadcast. */
export const PAUSE_ERROR_TYPES = new Set([
  'account_suspended',
  'invalid_api_key',
  'insufficient_credits',
  'kyc_not_approved',
  'ip_not_allowed',
  'message_rejected',
  // Same text for everyone: if it is too long for one, it is for all.
  'message_too_long',
  'signature_too_long',
]);

/** Pure: the class of an error response (HTTP status 0 = network error or timeout). */
export function classifyError(
  status: number,
  errorType: string | null | undefined,
): ErrorClass {
  if (errorType && PAUSE_ERROR_TYPES.has(errorType)) return 'pause_broadcast';
  if (status === 0 || status === 429 || status === 502 || status === 503)
    return 'retryable';
  if (status === 401 || status === 402 || status === 403)
    return 'pause_broadcast';
  if (status >= 500) return 'unknown';
  return 'fatal_for_recipient';
}

/** Removes digit runs that could be a phone number from provider messages. */
export const scrubDigits = (s: string) =>
  s.replace(/\+?\d[\d\s-]{5,}\d/g, '…');

export interface RateInfo {
  /** Requests left in the current minute, when the provider says. */
  remaining: number | null;
  /** Milliseconds to wait before the next request (Retry-After / reset). */
  waitMs: number | null;
}

/** Pure: reads X-RateLimit-Remaining, X-RateLimit-Reset and Retry-After. */
export function parseRateHeaders(
  get: (name: string) => string | null,
  now: number = Date.now(),
): RateInfo {
  const num = (v: string | null) => {
    if (v === null || v.trim() === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const remaining = num(get('x-ratelimit-remaining'));
  const retryAfter = num(get('retry-after'));
  const reset = num(get('x-ratelimit-reset'));
  let waitMs: number | null = null;
  if (retryAfter !== null) waitMs = Math.max(0, retryAfter * 1000);
  else if (remaining !== null && remaining <= 0 && reset !== null)
    // Epoch seconds or seconds from now.
    waitMs = Math.max(0, reset > 1e9 ? reset * 1000 - now : reset * 1000);
  return { remaining, waitMs };
}

export type SmsResult =
  | {
      ok: true;
      messageId: string | null;
      /** Total for the request (SMS parts × 1 or 2), as the provider says. */
      creditsUsed: number | null;
      creditsRemaining: number | null;
      /** SMS parts, when the provider says (not in every response). */
      parts: number | null;
      rate: RateInfo;
    }
  | {
      ok: false;
      kind: ErrorClass;
      errorType: string;
      /** Provider message with digit runs removed (safe to store and show). */
      message: string;
      rate: RateInfo;
    };

export type CheckResult =
  | {
      ok: true;
      finalText: string | null;
      characters: number | null;
      limit: number | null;
      /** `parts` / `credits_needed`: documented but not in the sample response. */
      parts: number | null;
      creditsNeeded: number | null;
    }
  | { ok: false; kind: ErrorClass; errorType: string; message: string };

type Json = Record<string, unknown>;

async function call(
  apiKey: string,
  method: 'GET' | 'POST',
  path: string,
  body?: Json,
): Promise<{ status: number; json: Json | null; rate: RateInfo }> {
  try {
    const res = await fetch(`${SMSHUB_BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    });
    const json = (await res.json().catch(() => null)) as Json | null;
    return {
      status: res.status,
      json,
      rate: parseRateHeaders((n) => res.headers.get(n)),
    };
  } catch {
    // Network error or timeout: nothing reached the provider as far as we know.
    return { status: 0, json: null, rate: { remaining: null, waitMs: null } };
  }
}

const str = (v: unknown) => (typeof v === 'string' ? v : null);
const numOrNull = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

function failure(status: number, json: Json | null) {
  const errorType =
    str(json?.['error_type']) ?? (status === 0 ? 'network_error' : `http_${status}`);
  return {
    ok: false as const,
    kind: classifyError(status, errorType),
    errorType,
    message: scrubDigits(str(json?.['message']) ?? errorType),
  };
}

const isSuccess = (status: number, json: Json | null) =>
  status >= 200 && status < 300 && json?.['status'] === 'success';

/** POST /api/sms: sends one message (charged). */
export async function smshubSend(
  apiKey: string,
  msisdn: string,
  text: string,
): Promise<SmsResult> {
  const { status, json, rate } = await call(apiKey, 'POST', '/api/sms', {
    msisdn,
    text,
    track_links: false,
  });
  if (!isSuccess(status, json)) return { ...failure(status, json), rate };
  const data = (json?.['data'] ?? {}) as Json;
  return {
    ok: true,
    messageId: str(data['message_id']) ?? (numOrNull(data['message_id'])?.toString() ?? null),
    creditsUsed: numOrNull(data['credits_used']),
    creditsRemaining: numOrNull(data['credits_remaining']),
    parts: numOrNull(data['parts']),
    rate,
  };
}

/** POST /api/test: every check of a send, nothing sent or charged. */
export async function smshubTest(
  apiKey: string,
  msisdn: string,
  text: string,
): Promise<CheckResult & { rate: RateInfo; requestId: string | null }> {
  const { status, json, rate } = await call(apiKey, 'POST', '/api/test', {
    msisdn,
    text,
    track_links: false,
  });
  const requestId = str(json?.['request_id']);
  if (!isSuccess(status, json)) return { ...failure(status, json), rate, requestId };
  const data = (json?.['data'] ?? {}) as Json;
  return {
    ok: true,
    finalText: str(data['final_text']),
    characters: numOrNull(data['characters']),
    limit: numOrNull(data['character_limit']),
    parts: numOrNull(data['parts']),
    creditsNeeded: numOrNull(data['credits_needed']),
    rate,
    requestId,
  };
}

/** GET /api/balance: credits left, or null when it cannot be read. */
export async function smshubBalance(apiKey: string): Promise<number | null> {
  const { status, json } = await call(apiKey, 'GET', '/api/balance');
  if (!isSuccess(status, json)) return null;
  return numOrNull(((json?.['data'] ?? {}) as Json)['credits']);
}
