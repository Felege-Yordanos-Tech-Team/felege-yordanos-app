'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db, members, profiles } from '@felege-yordanos/db/server';
import { fail, ok, type ActionResult } from '@/lib/action-result';
import { requireUser } from '@/lib/session';

const NOT_FOUND = 'Member ID not found. Please check your ID and try again.';
const TAKEN =
  'This member ID is already linked to another account. Contact an admin.';
const ALREADY_LINKED =
  'Your account is already linked to a member record. Contact an admin.';

const memberIdSchema = z
  .string()
  .trim()
  .min(1, 'Please enter your member ID.')
  .max(100, NOT_FOUND);

/** Postgres unique violation (23505), possibly wrapped by Drizzle. Returns the constraint name. */
function uniqueViolation(err: unknown): string | null {
  let e: unknown = err;
  for (let i = 0; i < 3 && e && typeof e === 'object'; i++) {
    const o = e as {
      code?: unknown;
      constraint_name?: unknown;
      cause?: unknown;
    };
    if (o.code === '23505') {
      return typeof o.constraint_name === 'string' ? o.constraint_name : '';
    }
    e = o.cause;
  }
  return null;
}

/**
 * Links the signed-in user's account to their member record (members.member_id).
 * Anyone signed in may claim an unclaimed record, once.
 * Returns the new display name for the welcome toast.
 */
export async function claimMember(
  memberIdInput: string,
): Promise<ActionResult<{ displayName: string }>> {
  const user = await requireUser();
  const parsed = memberIdSchema.safeParse(memberIdInput);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? NOT_FOUND);
  }

  const [existing] = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.authUserId, user.id))
    .limit(1);
  if (existing) return fail(ALREADY_LINKED);

  const [member] = await db
    .select({
      id: members.id,
      authUserId: members.authUserId,
      name: members.name,
      fatherName: members.fatherName,
    })
    .from(members)
    .where(eq(members.memberId, parsed.data))
    .limit(1);
  if (!member) return fail(NOT_FOUND);
  if (member.authUserId) return fail(TAKEN);

  const fullName = [member.name, member.fatherName].filter(Boolean).join(' ');

  try {
    const linked = await db.transaction(async (tx) => {
      // Only claims a record that is still unclaimed (guards against a race).
      const updated = await tx
        .update(members)
        .set({ authUserId: user.id, updatedAt: new Date() })
        .where(and(eq(members.id, member.id), isNull(members.authUserId)))
        .returning({ id: members.id });
      if (updated.length === 0) return false;

      if (fullName) {
        await tx
          .update(profiles)
          .set({ displayName: fullName, updatedAt: new Date() })
          .where(eq(profiles.id, user.id));
      }
      return true;
    });
    if (!linked) return fail(TAKEN);
  } catch (err) {
    // members.auth_user_id is unique: this account linked another record
    // in a concurrent request.
    if (uniqueViolation(err) !== null) return fail(ALREADY_LINKED);
    throw err;
  }

  revalidatePath('/claim');
  revalidatePath('/profile');
  revalidatePath('/dashboard');
  revalidatePath('/admin/users');
  // The display name is shown in the app shell header (layouts).
  revalidatePath('/', 'layout');
  return ok({ displayName: fullName });
}
