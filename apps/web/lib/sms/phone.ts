/**
 * Ethiopian mobile numbers for SMS. Pure.
 *
 * Phone numbers are personal data: never log them, put them in errors or
 * URLs, or show them unmasked in the message history (maskPhone).
 */

export type Network = 'ethio' | 'safaricom';

/**
 * The number as "09xxxxxxxx" (Ethio Telecom) or "07xxxxxxxx" (Safaricom),
 * or null when it is not a mobile number SMSHub can reach. Accepts spaces,
 * dashes, dots and brackets, and the forms 09…, 9…, 2519…, +2519…, 002519…
 * (and the same with 7).
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const compact = raw.trim().replace(/[\s\-.()]/g, '');
  const m = /^(?:\+251|00251|251|0)?([79]\d{8})$/.exec(compact);
  return m ? `0${m[1]}` : null;
}

/** Network of a normalised number. */
export const networkOf = (phone: string): Network =>
  phone.startsWith('07') ? 'safaricom' : 'ethio';

/** "09** *** *16": enough to recognise a number, not to use it. */
export function maskPhone(phone: string | null | undefined): string {
  const p = normalizePhone(phone) ?? (phone ?? '').replace(/\D/g, '');
  if (p.length < 4) return '—';
  return `${p.slice(0, 2)}** *** *${p.slice(-2)}`;
}

/**
 * The first usable number of a person (members have two phone fields), or
 * why there is none: 'no_phone' when every field is empty, 'invalid_phone'
 * when something is filled in but none of it is a mobile number.
 */
export function pickPhone(
  candidates: (string | null | undefined)[],
): { phone: string } | { skip: 'no_phone' | 'invalid_phone' } {
  let filled = false;
  for (const c of candidates) {
    if (!c?.trim()) continue;
    filled = true;
    const phone = normalizePhone(c);
    if (phone) return { phone };
  }
  return { skip: filled ? 'invalid_phone' : 'no_phone' };
}
