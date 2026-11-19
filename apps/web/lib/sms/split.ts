/**
 * Splits a text into the SMS messages sent to the provider (SMSHub).
 *
 * SMSHub sends one SMS segment per request and rejects longer texts: 160
 * characters when the whole text is GSM-7, 70 as soon as any other character
 * (Amharic) is in it, including the signature the provider appends
 * ("\n\n- <name>"). A longer text becomes numbered messages "(1/3) …", at
 * most MAX_PARTS, cut after a sentence end when that keeps the messages
 * about the same length, else at a space, never inside a word.
 *
 * Pure: used by the compose page (live preview), the server actions and the
 * worker, so what the sender sees is exactly what is sent.
 */

export const MAX_PARTS = 5;
export const GSM_LIMIT = 160;
export const UNICODE_LIMIT = 70;

export type SmsEncoding = 'gsm7' | 'ucs2';

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

/** What the provider appends to every message. */
export const signatureSuffix = (name: string) => `\n\n- ${name}`;

/** Collapses whitespace runs to one space and trims. */
export const normalizeSmsText = (text: string) =>
  text.replace(/\s+/g, ' ').trim();

/** Sentence ends in Amharic and Latin text. */
const SENTENCE_END = /(?:።|፡፡|\.|!|\?|፧)["'»”’)]*$/;

const partPrefix = (i: number, n: number) => `(${i}/${n}) `;

export type SplitResult =
  | {
      ok: true;
      /** The messages as sent to the provider (without the signature). */
      parts: string[];
      encoding: SmsEncoding;
      /** Characters per SMS for this text (160 or 70). */
      limit: number;
      /** Length of each message with the signature, as the provider counts. */
      lengths: number[];
    }
  | { ok: false; reason: 'empty' }
  | { ok: false; reason: 'too_many_parts'; needed: number }
  | { ok: false; reason: 'word_too_long'; word: string };

/**
 * The messages for `text` with the provider's signature `signature` (the
 * name, e.g. "FYSS").
 */
export function splitSms(text: string, signature: string): SplitResult {
  const clean = normalizeSmsText(text);
  if (!clean) return { ok: false, reason: 'empty' };

  const suffix = signatureSuffix(signature);
  // The number prefix is GSM-7, so it never changes the encoding.
  const encoding: SmsEncoding = isGsm7(clean + suffix) ? 'gsm7' : 'ucs2';
  const limit = encoding === 'gsm7' ? GSM_LIMIT : UNICODE_LIMIT;
  const len = (s: string) => smsLength(s, encoding);
  const lengthsOf = (parts: string[]) => parts.map((p) => len(p + suffix));

  const room = limit - len(suffix);
  if (len(clean) <= room)
    return {
      ok: true,
      parts: [clean],
      encoding,
      limit,
      lengths: lengthsOf([clean]),
    };

  // Numbered: "(i/n) " is 6 characters for n up to 9.
  const budget = room - partPrefix(1, MAX_PARTS).length;
  const words = clean.split(' ');
  const cost = words.map(len);
  const tooLong = words.find((_, i) => cost[i] > budget);
  if (tooLong !== undefined)
    return { ok: false, reason: 'word_too_long', word: tooLong };

  // Fewest messages: greedy packing.
  let needed = 1;
  let used = -1;
  for (const c of cost) {
    if (used + 1 + c > budget) {
      needed += 1;
      used = c;
    } else used += 1 + c;
  }
  if (needed > MAX_PARTS) return { ok: false, reason: 'too_many_parts', needed };

  const groups = balancedCuts(words, cost, needed, budget);
  const parts = groups.map(
    ([a, b], i) => partPrefix(i + 1, needed) + words.slice(a, b).join(' '),
  );
  return { ok: true, parts, encoding, limit, lengths: lengthsOf(parts) };
}

/**
 * Cuts `words` into exactly `n` messages of at most `budget` that are about
 * the same length, preferring cuts after a sentence end. Dynamic programming
 * over word boundaries: cost = squared distance from the average length,
 * plus a penalty for each cut that is not after a sentence end. Returns
 * [from, to) word ranges.
 */
function balancedCuts(
  words: string[],
  cost: number[],
  n: number,
  budget: number,
): [number, number][] {
  const W = words.length;
  // pre[i] = length of words[0..i) joined with spaces, plus one.
  const pre = [0];
  for (let i = 0; i < W; i++) pre.push(pre[i] + cost[i] + 1);
  const segLen = (a: number, b: number) => pre[b] - pre[a] - 1;
  const total = segLen(0, W);
  const target = total / n;
  // A cut that is not after a sentence end (or one that leaves the message
  // less than half full) costs as much as being half a message off.
  const penalty = (budget * 0.5) ** 2;
  const sentenceEnd = words.map((w) => SENTENCE_END.test(w));

  // best[k][j]: cheapest way to put words[0..j) into k messages.
  const best: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(W + 1).fill(Infinity),
  );
  const from: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(W + 1).fill(-1),
  );
  best[0][0] = 0;
  for (let k = 1; k <= n; k++) {
    for (let j = k; j <= W; j++) {
      for (let i = j - 1; i >= k - 1; i--) {
        const l = segLen(i, j);
        if (l > budget) break;
        if (best[k - 1][i] === Infinity) continue;
        const goodCut = sentenceEnd[j - 1] && l >= budget / 2;
        const cut = j < W && !goodCut ? penalty : 0;
        const c = best[k - 1][i] + (l - target) ** 2 + cut;
        if (c < best[k][j]) {
          best[k][j] = c;
          from[k][j] = i;
        }
      }
    }
  }

  const ranges: [number, number][] = [];
  let j = W;
  for (let k = n; k >= 1; k--) {
    const i = from[k][j];
    ranges.unshift([i, j]);
    j = i;
  }
  return ranges;
}

/** Credits for one recipient: Ethio Telecom 1 per message, Safaricom 2. */
export const CREDITS_PER_MESSAGE = { ethio: 1, safaricom: 2 } as const;

/**
 * Estimated credits: messages per person × (Ethio Telecom recipients + 2 ×
 * Safaricom recipients).
 */
export const estimateCredits = (
  partsPerPerson: number,
  recipients: { ethio: number; safaricom: number },
) =>
  partsPerPerson *
  (recipients.ethio * CREDITS_PER_MESSAGE.ethio +
    recipients.safaricom * CREDITS_PER_MESSAGE.safaricom);
