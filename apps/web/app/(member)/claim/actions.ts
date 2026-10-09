'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, memberLinkRequests, members } from '@felege-yordanos/db/server';
import { fail, ok, type ActionResult } from '@/lib/action-result';
import { normalizeMemberId } from '@/lib/member-id';
import { requireUser } from '@/lib/session';

const NOT_FOUND = 'Member ID not found. Please check your ID and try again.';
const TAKEN =
  'This member ID is already linked to another account. Contact an admin.';
const ALREADY_LINKED = 'Your account is already linked to a member record.';
const NOT_VERIFIED = 'Verify your email first, then request the link.';

const memberIdSchema = z
  .string()
  .trim()
  .min(1, 'Please enter your member ID.')
  .max(100, NOT_FOUND);

/**
 * Asks an admin to link the signed-in account to a member record.
 * Member ids are sequential, so nothing is linked until an admin approves
 * (app/(admin)/admin/member-links). A new request replaces an open one.
 * The member's name is never shown to the requester.
 */
export async function requestMemberLink(
  memberIdInput: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = memberIdSchema.safeParse(memberIdInput);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? NOT_FOUND);
  }
  if (!user.emailVerified) return fail(NOT_VERIFIED);
  if (user.memberRecordId !== null) return fail(ALREADY_LINKED);

  const wanted = normalizeMemberId(parsed.data);
  const [member] = await db
    .select({ id: members.id, authUserId: members.authUserId })
    .from(members)
    .where(sql`lower(${members.memberId}) = lower(${wanted})`)
    .limit(1);
  if (!member) return fail(NOT_FOUND);
  if (member.authUserId) return fail(TAKEN);

  await db.transaction(async (tx) => {
    // One open request per account: replace the old one.
    await tx
      .delete(memberLinkRequests)
      .where(
        and(
          eq(memberLinkRequests.userId, user.id),
          eq(memberLinkRequests.status, 'pending'),
        ),
      );
    await tx
      .insert(memberLinkRequests)
      .values({ userId: user.id, memberId: member.id });
  });

  revalidatePath('/claim');
  revalidatePath('/dashboard');
  revalidatePath('/admin/member-links');
  return ok();
}

/** Withdraws the signed-in user's open request. */
export async function cancelMemberLinkRequest(): Promise<ActionResult> {
  const user = await requireUser();
  await db
    .delete(memberLinkRequests)
    .where(
      and(
        eq(memberLinkRequests.userId, user.id),
        eq(memberLinkRequests.status, 'pending'),
      ),
    );
  revalidatePath('/claim');
  revalidatePath('/dashboard');
  revalidatePath('/admin/member-links');
  return ok();
}
