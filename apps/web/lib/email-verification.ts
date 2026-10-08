/**
 * Email verification by 6-digit code (Better Auth Email OTP plugin, see
 * lib/auth.ts). Until an account is verified it only gets the songbook and
 * its profile (lib/session.ts).
 *
 * Codes are sent from the server only (app/(public)/verify-email/actions.ts),
 * always to the signed-in user's own address.
 */
import 'server-only';
import { desc, eq } from 'drizzle-orm';
import { authVerifications, db } from '@felege-yordanos/db/server';

/** Code lifetime in seconds. The email says "valid for 10 minutes". */
export const CODE_EXPIRES_IN = 10 * 60;
/** Wrong guesses allowed per code. */
export const CODE_ALLOWED_ATTEMPTS = 5;
/** Seconds between two codes for the same account. */
export const RESEND_COOLDOWN = 60;

// The plugin stores codes as "<code>:<wrong attempts>" under this identifier.
const identifier = (email: string) =>
  `email-verification-otp-${email.toLowerCase()}`;

export interface CodeState {
  /** An unexpired code that can still be tried exists. */
  hasValidCode: boolean;
  /** Seconds until a new code may be sent (0 = now). */
  resendIn: number;
}

/**
 * Whether a usable code is out there, and when the next one may be sent.
 * A wrong guess replaces the row but keeps its expiry, so the send time is
 * always expiresAt - CODE_EXPIRES_IN.
 */
export async function codeState(email: string): Promise<CodeState> {
  const [row] = await db
    .select({
      value: authVerifications.value,
      expiresAt: authVerifications.expiresAt,
    })
    .from(authVerifications)
    .where(eq(authVerifications.identifier, identifier(email)))
    .orderBy(desc(authVerifications.expiresAt))
    .limit(1);
  if (!row) return { hasValidCode: false, resendIn: 0 };

  const now = Date.now();
  const sentAt = row.expiresAt.getTime() - CODE_EXPIRES_IN * 1000;
  const attempts = Number(row.value.slice(row.value.lastIndexOf(':') + 1));
  return {
    hasValidCode:
      row.expiresAt.getTime() > now && attempts < CODE_ALLOWED_ATTEMPTS,
    resendIn: Math.max(
      0,
      Math.ceil((sentAt + RESEND_COOLDOWN * 1000 - now) / 1000),
    ),
  };
}
