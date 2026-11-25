/**
 * The SMS sent to the provider (SMSHub) for a text, and how many SMS parts
 * it is charged as.
 *
 * SMSHub takes the whole text in one request (up to 10 SMS parts) and
 * appends the signature itself ("\n\n- <name>"); the phone joins the parts
 * into one message. The app only counts, for the preview, the estimate and
 * the limit (smshub.et/docs, "Character limits & encoding", 2026-11-20):
 * - any non-GSM character (Amharic): 70 characters in one SMS, otherwise 67
 *   per part;
 * - GSM-7 only: 160 in one SMS, otherwise 153 per part (extension
 *   characters count two);
 * - the signature is part of the length; at most MAX_PARTS parts.
 *
 * Pure: used by the compose page (live preview), the server actions and the
 * worker, so what the sender sees is exactly what is sent.
 */

export const MAX_PARTS = 10;

export type SmsEncoding = 'gsm7' | 'ucs2';

/** Characters in a single SMS, and per part of a longer one. */
export const SMS_LIMITS = {
  gsm7: { single: 160, part: 153 },
  ucs2: { single: 70, part: 67 },
} as const;

// GSM 03.38 basic character set (one septet each).
const GSM_BASIC = new Set(
  Array.from(
    '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?' +
      '¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà',
  ),
);
// GSM extension table: escape + character, so two septets each.
const GSM_EXTENDED = new Set(Array.from('^{}\\[~]|€\f'));

/** Whether every character can be sent as GSM-7. */
export function isGsm7(text: string): boolean {
  for (const ch of text)
    if (!GSM_BASIC.has(ch) && !GSM_EXTENDED.has(ch)) return false;
  return true;
}

/**
 * Length as the network counts it: GSM-7 septets (extension characters
 * count two), or UTF-16 code units for UCS-2 (a character outside the BMP,
 * such as an emoji, counts two).
 */
export function smsLength(text: string, encoding: SmsEncoding): number {
  if (encoding === 'ucs2') return text.length;
  let n = 0;
  for (const ch of text) n += GSM_EXTENDED.has(ch) ? 2 : 1;
  return n;
}

/** SMS parts for a length (signature included). 0 for an empty text. */
export function smsPartCount(length: number, encoding: SmsEncoding): number {
  const { single, part } = SMS_LIMITS[encoding];
  if (length <= 0) return 0;
  return length <= single ? 1 : Math.ceil(length / part);
}

/** Longest text the provider takes (signature included): 670 or 1530. */
export const maxSmsLength = (encoding: SmsEncoding) =>
  MAX_PARTS * SMS_LIMITS[encoding].part;

/**
 * Longest text a form or action accepts before the parts rule: above the
 * longest GSM-7 message, so the rule (with its "remove N characters") decides.
 */
export const MAX_SMS_INPUT = 1600;

/** What the provider appends to every message. */
export const signatureSuffix = (name: string) => `\n\n- ${name}`;

/**
 * The text as it is sent (#153). Line breaks stay exactly as typed (blank
 * lines too, none collapsed); "\r\n" and "\r" become "\n". Inside a line,
 * runs of spaces, tabs and other whitespace become one space, and spaces at
 * the start or end of a line are dropped. The whole text is trimmed.
 * A line break is one character in GSM-7 and in UCS-2.
 */
export const normalizeSmsText = (text: string) =>
  text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[^\S\n]+/g, ' ').trim())
    .join('\n')
    .trim();

/** Line breaks in a text (for the provider check, counts only). */
export const lineBreakCount = (text: string) =>
  (text.match(/\r\n|\r|\n/g) ?? []).length;

/**
 * The provider's final_text (from /api/test, signature included) against
 * what was sent: the line-break counts when they differ, else null (also
 * when the provider gave no final_text). Counts only, never the text.
 */
export function lineBreakMismatch(
  sent: string,
  signature: string,
  finalText: string | null,
): { expected: number; received: number } | null {
  if (finalText === null) return null;
  const expected = lineBreakCount(sent + signatureSuffix(signature));
  const received = lineBreakCount(finalText);
  return expected === received ? null : { expected, received };
}

export type SmsMessage =
  | {
      ok: true;
      /** The text sent to the provider (it appends the signature). */
      text: string;
      /** What arrives on the phone: text + signature. */
      finalText: string;
      encoding: SmsEncoding;
      /** Length of finalText as the provider counts it. */
      length: number;
      /** SMS parts the provider charges per person (1 to MAX_PARTS). */
      smsParts: number;
    }
  | { ok: false; reason: 'empty' }
  | {
      ok: false;
      reason: 'too_long';
      encoding: SmsEncoding;
      length: number;
      /** Parts it would need (more than MAX_PARTS). */
      smsParts: number;
      /** Characters to remove so it fits. */
      excess: number;
    };

/**
 * The one message for `text` with the provider's signature `signature`
 * (the name, e.g. "FYSS").
 */
export function composeSms(text: string, signature: string): SmsMessage {
  const clean = normalizeSmsText(text);
  if (!clean) return { ok: false, reason: 'empty' };
  const finalText = clean + signatureSuffix(signature);
  const encoding: SmsEncoding = isGsm7(finalText) ? 'gsm7' : 'ucs2';
  const length = smsLength(finalText, encoding);
  const smsParts = smsPartCount(length, encoding);
  if (smsParts > MAX_PARTS)
    return {
      ok: false,
      reason: 'too_long',
      encoding,
      length,
      smsParts,
      excess: length - maxSmsLength(encoding),
    };
  return { ok: true, text: clean, finalText, encoding, length, smsParts };
}

/** Credits per SMS part: Ethio Telecom 1, Safaricom 2. */
export const CREDITS_PER_PART = { ethio: 1, safaricom: 2 } as const;

/**
 * Estimated credits: SMS parts per person × (Ethio Telecom recipients + 2 ×
 * Safaricom recipients).
 */
export const estimateCredits = (
  smsParts: number,
  recipients: { ethio: number; safaricom: number },
) =>
  smsParts *
  (recipients.ethio * CREDITS_PER_PART.ethio +
    recipients.safaricom * CREDITS_PER_PART.safaricom);
