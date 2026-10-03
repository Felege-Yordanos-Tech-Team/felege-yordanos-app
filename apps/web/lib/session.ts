/**
 * Server-side helpers for the signed-in user.
 *
 * Wrapped in React cache(): a layout and a page in the same request share
 * one lookup instead of repeating it.
 */
import 'server-only';
import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db, profiles, type Role } from '@felege-yordanos/db/server';
import { auth } from './auth';

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  departmentId: number | null;
};

/** The signed-in user with their profile, or null when signed out. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, session.user.id))
    .limit(1);

  return {
    id: session.user.id,
    email: session.user.email,
    displayName:
      profile?.displayName || session.user.name || session.user.email,
    role: profile?.role ?? 'member',
    departmentId: profile?.departmentId ?? null,
  };
});

/** Use in pages, layouts and server actions that need a signed-in user. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

/** Redirects to the dashboard when the user's role is not in `roles`. */
export async function requireRole(
  roles: readonly Role[],
): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect('/dashboard');
  return user;
}
