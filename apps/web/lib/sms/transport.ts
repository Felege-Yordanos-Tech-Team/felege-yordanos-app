/**
 * How SMS leave the app, from SMS_TRANSPORT:
 * - console (default): prints a masked number and the message length in
 *   the server log; nothing leaves the machine.
 * - smshub_test (staging): calls SMSHub's /api/test for every message: all
 *   the provider's checks run, nothing is sent or charged.
 * - smshub (production): real sends.
 *
 * The SMSHub transports need SMSHUB_API_KEY. Without it the app still starts;
 * the pages say "SMS is not configured" and the server refuses to send.
 */
import 'server-only';
import { maskPhone } from './phone';
import {
  smshubBalance,
  smshubSend,
  smshubTest,
  type CheckResult,
  type SmsResult,
} from './smshub';

export type TransportName = 'console' | 'smshub_test' | 'smshub';

export interface SmsTransport {
  name: TransportName;
  /** False for an SMSHub transport without a key (or an unknown name). */
  configured: boolean;
  /** Sends cost credits (the balance must cover a broadcast). */
  charges: boolean;
  /** The balance can be read (SMSHub transports). */
  hasBalance: boolean;
  send(msisdn: string, text: string): Promise<SmsResult>;
  check(msisdn: string, text: string): Promise<CheckResult>;
  balance(): Promise<number | null>;
}

const NOT_CONFIGURED = {
  ok: false as const,
  kind: 'pause_broadcast' as const,
  errorType: 'not_configured',
  message: 'SMS is not configured.',
};
const NO_RATE = { remaining: null, waitMs: null };

/** Signature name the provider appends ("\n\n- FYSS"); used to count characters. */
export const smsSignature = () => process.env['SMS_SIGNATURE']?.trim() || 'FYSS';

export function smsTransportName(): TransportName | null {
  const v = process.env['SMS_TRANSPORT']?.trim() || 'console';
  return v === 'console' || v === 'smshub_test' || v === 'smshub' ? v : null;
}

function consoleTransport(): SmsTransport {
  return {
    name: 'console',
    configured: true,
    charges: false,
    hasBalance: false,
    async send(msisdn, text) {
      console.log(
        `[sms:console] ${maskPhone(msisdn)} ${text.length} chars (not sent)`,
      );
      return {
        ok: true,
        messageId: null,
        creditsUsed: 0,
        creditsRemaining: null,
        parts: null,
        rate: NO_RATE,
      };
    },
    async check() {
      return {
        ok: true,
        finalText: null,
        characters: null,
        limit: null,
        parts: null,
        creditsNeeded: null,
      };
    },
    async balance() {
      return null;
    },
  };
}

function smshubTransport(name: 'smshub' | 'smshub_test'): SmsTransport {
  const key = process.env['SMSHUB_API_KEY']?.trim() ?? '';
  const configured = key.length > 0;
  return {
    name,
    configured,
    charges: name === 'smshub',
    hasBalance: true,
    async send(msisdn, text) {
      if (!configured) return { ...NOT_CONFIGURED, rate: NO_RATE };
      if (name === 'smshub') return smshubSend(key, msisdn, text);
      // Staging: the provider checks everything, nothing is sent or charged.
      const res = await smshubTest(key, msisdn, text);
      if (!res.ok) return res;
      return {
        ok: true,
        messageId: res.requestId ? `test:${res.requestId}` : null,
        creditsUsed: 0,
        creditsRemaining: null,
        parts: res.parts,
        rate: res.rate,
      };
    },
    async check(msisdn, text) {
      if (!configured) return NOT_CONFIGURED;
      const res = await smshubTest(key, msisdn, text);
      if (!res.ok)
        return {
          ok: false,
          kind: res.kind,
          errorType: res.errorType,
          message: res.message,
        };
      return {
        ok: true,
        finalText: res.finalText,
        characters: res.characters,
        limit: res.limit,
        parts: res.parts,
        creditsNeeded: res.creditsNeeded,
      };
    },
    async balance() {
      return configured ? smshubBalance(key) : null;
    },
  };
}

function unknownTransport(): SmsTransport {
  return {
    ...consoleTransport(),
    name: 'console',
    configured: false,
    async send() {
      return { ...NOT_CONFIGURED, rate: NO_RATE };
    },
    async check() {
      return NOT_CONFIGURED;
    },
  };
}

/** The transport for this process (from the environment). */
export function smsTransport(): SmsTransport {
  const name = smsTransportName();
  if (name === null) return unknownTransport();
  return name === 'console' ? consoleTransport() : smshubTransport(name);
}

/** What the pages may know about SMS (no key, nothing secret). */
export interface SmsStatus {
  transport: TransportName;
  configured: boolean;
  charges: boolean;
  hasBalance: boolean;
  signature: string;
}

export function smsStatus(): SmsStatus {
  const t = smsTransport();
  return {
    transport: t.name,
    configured: t.configured,
    charges: t.charges,
    hasBalance: t.hasBalance,
    signature: smsSignature(),
  };
}
