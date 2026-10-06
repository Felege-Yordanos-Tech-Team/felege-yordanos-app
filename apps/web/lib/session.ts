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
import { db, members, profiles, type Role } from '@felege-yordanos/db/server';
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
  /** members.id of the linked member record, or null when not linked yet. */
  memberRecordId: number | null;
};

/** The signed-in user with their profile, or null when signed out. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const [row] = await db
    .select({ profile: profiles, memberRecordId: members.id })
    .from(profiles)
    .leftJoin(members, eq(members.authUserId, profiles.id))
    .where(eq(profiles.id, session.user.id))
    .limit(1);
  const profile = row?.profile;

  return {
    id: session.user.id,
    email: session.user.email,
    displayName:
      profile?.displayName || session.user.name || session.user.email,
    role: profile?.role ?? 'member',
    departmentId: profile?.departmentId ?? null,
    memberRecordId: row?.memberRecordId ?? null,
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

/**
 * For member features (events, donations, notices): plain members must have a
 * linked member record first, otherwise they are sent to /claim. Staff roles
 * keep access without one.
 */
export async function requireLinkedMember(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!hasMemberAccess(user)) redirect('/claim?required=1');
  return user;
}

/** Linked member, or a staff role. Same rule for pages and server actions. */
export const hasMemberAccess = (
  user: Pick<CurrentUser, 'role' | 'memberRecordId'>,
) => user.role !== 'member' || user.memberRecordId !== null;
