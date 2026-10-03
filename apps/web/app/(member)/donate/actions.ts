'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, donations, PAYMENT_METHODS } from '@felege-yordanos/db/server';
import { fail, ok, type ActionResult } from '@/lib/action-result';
import { requireUser } from '@/lib/session';
import { deleteReceipt, saveReceipt } from '@/lib/storage';

const MAX_AMOUNT = 10_000_000;
const MAX_NOTES = 500;

const donationSchema = z.object({
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount (up to 2 decimals).')
    .refine((v) => Number(v) > 0, 'Amount must be greater than zero.')
    .refine(
      (v) => Number(v) <= MAX_AMOUNT,
      `Amount must be at most ${MAX_AMOUNT.toLocaleString()} ETB.`,
    ),
  paymentMethod: z.enum(PAYMENT_METHODS).nullable(),
  notes: z
    .string()
    .trim()
    .max(MAX_NOTES, `Notes must be at most ${MAX_NOTES} characters.`)
    .nullable(),
});

const text = (formData: FormData, key: string) => {
  const v = formData.get(key);
  return typeof v === 'string' && v.trim() !== '' ? v : null;
};

/**
 * Creates a donation for the signed-in user (always status 'pending').
 * FormData fields: amount, paymentMethod (optional), notes (optional),
 * receipt (optional file).
 */
export async function createDonation(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = donationSchema.safeParse({
    amount: text(formData, 'amount') ?? '',
    paymentMethod: text(formData, 'paymentMethod'),
    notes: text(formData, 'notes'),
  });
  if (!parsed.success)
    return fail(parsed.error.issues[0]?.message ?? 'Invalid donation.');

  // Any signed-in user may donate, but only for themselves (donorId is never
  // taken from the client).
  let receiptKey: string | null = null;
  const receipt = formData.get('receipt');
  if (receipt instanceof File && receipt.size > 0) {
    try {
      receiptKey = await saveReceipt(user.id, receipt);
    } catch (err) {
      return fail(
        err instanceof Error ? err.message : 'Could not upload the receipt.',
      );
    }
  }

  try {
    await db.insert(donations).values({
      donorId: user.id,
      amount: parsed.data.amount,
      currency: 'ETB',
      paymentMethod: parsed.data.paymentMethod,
      receiptUrl: receiptKey,
      notes: parsed.data.notes,
      status: 'pending',
    });
  } catch {
    // Don't leave an orphaned file behind.
    if (receiptKey) await deleteReceipt(receiptKey);
    return fail('Could not save your donation. Please try again.');
  }

  revalidatePath('/donate');
  revalidatePath('/admin/donations');
  revalidatePath('/dashboard');
  revalidatePath('/admin');
  return ok();
}
