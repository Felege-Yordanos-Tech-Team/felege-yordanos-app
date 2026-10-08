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
  /**
   * Role in effect: 'member' until the email is verified, so every rule in
   * lib/permissions.ts treats an unverified admin or dept head as a member.
   */
  role: Role;
  /** null until the email is verified (see role). */
  departmentId: number | null;
  /** Role in the profile, even before it is in effect. UI text only, never permission checks. */
  assignedRole: Role;
  emailVerified: boolean;
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
  const emailVerified = session.user.emailVerified;
  const assignedRole = profile?.role ?? 'member';

  return {
    id: session.user.id,
    email: session.user.email,
    displayName:
      profile?.displayName || session.user.name || session.user.email,
    role: emailVerified ? assignedRole : 'member',
    departmentId: emailVerified ? (profile?.departmentId ?? null) : null,
    assignedRole,
    emailVerified,
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

/** Sends users without a verified email to /verify-email. */
export async function requireVerifiedEmail(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!user.emailVerified) redirect('/verify-email?required=1');
  return user;
}

/**
 * For member features (events, donations, notices): the email must be
 * verified, and plain members must have a linked member record, otherwise
 * they are sent to /verify-email or /claim. Staff roles keep access without
 * a member record.
 */
export async function requireLinkedMember(): Promise<CurrentUser> {
  const user = await requireVerifiedEmail();
  if (!hasMemberAccess(user)) redirect('/claim?required=1');
  return user;
}

/**
 * Verified email, and a linked member or a staff role. Same rule for pages
 * and server actions.
 */
export const hasMemberAccess = (
  user: Pick<CurrentUser, 'emailVerified' | 'role' | 'memberRecordId'>,
) =>
  user.emailVerified &&
  (user.role !== 'member' || user.memberRecordId !== null);
