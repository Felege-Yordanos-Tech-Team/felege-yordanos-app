/**
 * Better Auth server configuration.
 *
 * Docs: https://www.better-auth.com/docs
 * Tables: libs/db/src/schema/auth.ts
 */
import 'server-only';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { emailOTP } from 'better-auth/plugins';
import {
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
  db,
  profiles,
} from '@felege-yordanos/db/server';
import { sendEmail } from './email';
import { passwordResetEmail, verificationCodeEmail } from './email-templates';
import {
  CODE_ALLOWED_ATTEMPTS,
  CODE_EXPIRES_IN,
} from './email-verification';

// Development only: accept the app on any localhost port. `pnpm dev` moves to
// 3001, 3002, ... when 3000 is busy, and Better Auth rejects sign-in from an
// origin other than BETTER_AUTH_URL ("Invalid origin").
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const devTrustedOrigins = (request?: Request) => {
  const origin = request?.headers.get('origin');
  return origin && LOCAL_ORIGIN.test(origin) ? [origin] : [];
};

// Google sign-in only when both keys are set (staging and production; local
// dev without them hides the button).
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
export const googleEnabled = Boolean(googleClientId && googleClientSecret);

export const auth = betterAuth({
  appName: 'Felege Yordanos',
  // OAuth errors (cancelled, account not linked, ...) come back as
  // /login?error=<code>; login-form.tsx shows the message.
  onAPIError: { errorURL: '/login' },
  trustedOrigins:
    process.env.NODE_ENV === 'production' ? [] : devTrustedOrigins,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: authUsers,
      session: authSessions,
      account: authAccounts,
      verification: authVerifications,
    },
  }),
  advanced: {
    // uuid ids, so existing Supabase user ids can be kept at cutover.
    database: { generateId: 'uuid' },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // The reset email says "valid for 1 hour": change both together.
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({ to: user.email, ...passwordResetEmail({ url }) });
    },
  },
  // Google sets emailVerified from its email_verified claim, so Google
  // accounts skip the code step. Profiles come from databaseHooks below.
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            // Shared phones: always let the member pick the Google account.
            prompt: 'select_account',
          },
        }
      : {},
  // A Google sign-in with the email of an existing account joins that
  // account, but only when its email is already verified (Better Auth's
  // requireLocalEmailVerified default). Otherwise whoever registered the
  // email with a password could share the account; the member gets
  // ?error=account_not_linked and verifies with their password first.
  account: {
    accountLinking: { enabled: true, trustedProviders: ['google'] },
  },
  // Email verification by 6-digit code (emailOTP below). Sign-in stays open
  // to unverified accounts; lib/session.ts limits what they can use.
  emailVerification: { sendOnSignUp: true },
  // Email OTP routes the app does not use: no sign-in or password reset by
  // code, and codes are only sent by the server (verify-email/actions.ts).
  disabledPaths: [
    '/email-otp/send-verification-otp',
    '/email-otp/check-verification-otp',
    '/sign-in/email-otp',
    '/email-otp/request-password-reset',
    '/forget-password/email-otp',
    '/email-otp/reset-password',
    '/email-otp/request-email-change',
    '/email-otp/change-email',
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh expiry once a day
    // Signed session copy in a cookie: most requests skip the database lookup.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  databaseHooks: {
    user: {
      create: {
        // Every login account gets a profile, like the old Supabase trigger did.
        after: async (user) => {
          await db
            .insert(profiles)
            .values({
              id: user.id,
              role: 'member',
              displayName: user.name || user.email,
            })
            .onConflictDoNothing();
        },
      },
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: CODE_EXPIRES_IN,
      allowedAttempts: CODE_ALLOWED_ATTEMPTS,
      // With overrideDefaultEmailVerification the sign-up code is sent through
      // emailVerification.sendOnSignUp above; this flag alone does nothing.
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      // The OTP routes never create accounts.
      disableSignUp: true,
      // Per IP and route. Higher than the default 3 because many members share
      // one IP (church Wi-Fi, mobile carrier NAT); guessing is still limited
      // by allowedAttempts per code and the resend cooldown.
      rateLimit: { window: 60, max: 30 },
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (type !== 'email-verification') return;
        // Not awaited (timing attacks, see the plugin docs). sendEmail logs
        // failures without the message, so the code never reaches the logs.
        sendEmail({ to: email, ...verificationCodeEmail({ code: otp }) }).catch(
          () => undefined,
        );
      },
    }),
    // Must be last: lets server actions set auth cookies.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
