'use server';

import { z } from 'zod';
import { fail, ok, type ActionResult } from '@/lib/action-result';
import { auth } from '@/lib/auth';
import { codeState, RESEND_COOLDOWN } from '@/lib/email-verification';
import { requireUser } from '@/lib/session';

const WAIT = 'Please wait a moment before asking for a new code.';
const FAILED = 'Could not send the code. Please try again.';

/**
 * Sends a verification code to the signed-in user's own email address.
 *
 * auto: the first visit of /verify-email. Sends only when no usable code
 * exists, so reloading the page (or arriving right after sign-up, which
 * already sent one) does not send another. Manual resends wait
 * RESEND_COOLDOWN seconds after the last code.
 */
export async function sendVerificationCode(
  auto: boolean,
): Promise<ActionResult<{ sent: boolean; resendIn: number }>> {
  const user = await requireUser();
  if (!z.boolean().safeParse(auto).success) return fail(FAILED);
  if (user.emailVerified) return ok({ sent: false, resendIn: 0 });

  const state = await codeState(user.email);
  if (auto && state.hasValidCode) {
    return ok({ sent: false, resendIn: state.resendIn });
  }
  if (state.resendIn > 0) {
    return auto ? ok({ sent: false, resendIn: state.resendIn }) : fail(WAIT);
  }

  try {
    await auth.api.sendVerificationOTP({
      body: { email: user.email, type: 'email-verification' },
    });
  } catch {
    return fail(FAILED);
  }
  return ok({ sent: true, resendIn: RESEND_COOLDOWN });
}
