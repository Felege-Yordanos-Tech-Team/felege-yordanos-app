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
import {
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
  db,
  profiles,
} from '@felege-yordanos/db/server';
import { sendEmail } from './email';
import { passwordResetEmail } from './email-templates';

// Development only: accept the app on any localhost port. `pnpm dev` moves to
// 3001, 3002, ... when 3000 is busy, and Better Auth rejects sign-in from an
// origin other than BETTER_AUTH_URL ("Invalid origin").
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const devTrustedOrigins = (request?: Request) => {
  const origin = request?.headers.get('origin');
  return origin && LOCAL_ORIGIN.test(origin) ? [origin] : [];
};

export const auth = betterAuth({
  appName: 'Felege Yordanos',
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
  // Must be last: lets server actions set auth cookies.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
