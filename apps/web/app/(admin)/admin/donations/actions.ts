'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, donations } from '@felege-yordanos/db/server';
import { fail, NOT_ALLOWED, ok, type ActionResult } from '@/lib/action-result';
import { canReviewDonations } from '@/lib/permissions';
import { requireUser, type CurrentUser } from '@/lib/session';

const idSchema = z.uuid();
const reasonSchema = z
  .string()
  .trim()
  .min(1, 'Please give a reason for rejecting this donation.')
  .max(500, 'Reason must be at most 500 characters.');

function revalidate() {
  revalidatePath('/donate');
  revalidatePath('/admin/donations');
  revalidatePath('/dashboard');
  revalidatePath('/admin');
}

/** Sets a pending donation to verified or rejected. */
async function review(
  user: CurrentUser,
  donationId: string,
  status: 'verified' | 'rejected',
  rejectionReason: string | null,
): Promise<ActionResult> {
  if (!canReviewDonations(user)) return fail(NOT_ALLOWED);

  const id = idSchema.safeParse(donationId);
  if (!id.success) return fail('Donation not found.');

  const [existing] = await db
    .select({ status: donations.status })
    .from(donations)
    .where(eq(donations.id, id.data))
    .limit(1);
  if (!existing) return fail('Donation not found.');
  if (existing.status !== 'pending')
    return fail(`This donation is already ${existing.status}.`);

  // The status condition makes concurrent reviews safe: only one wins.
  const updated = await db
    .update(donations)
    .set({
      status,
      verifiedBy: user.id,
      verifiedAt: new Date(),
      rejectionReason,
    })
    .where(and(eq(donations.id, id.data), eq(donations.status, 'pending')))
    .returning({ id: donations.id });
  if (updated.length === 0)
    return fail('This donation was already reviewed by someone else.');

  revalidate();
  return ok();
}

export async function verifyDonation(
  donationId: string,
): Promise<ActionResult> {
  const user = await requireUser();
  return review(user, donationId, 'verified', null);
}

export async function rejectDonation(
  donationId: string,
  reason: string,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!canReviewDonations(user)) return fail(NOT_ALLOWED);
  const parsed = reasonSchema.safeParse(reason);
  if (!parsed.success)
    return fail(parsed.error.issues[0]?.message ?? 'Invalid reason.');
  return review(user, donationId, 'rejected', parsed.data);
}
