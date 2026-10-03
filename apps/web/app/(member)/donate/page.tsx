import { desc, eq } from 'drizzle-orm';
import { db, donations } from '@felege-yordanos/db/server';
import { requireUser } from '@/lib/session';
import { DonateForm, type DonationRow } from './donate-form';

export default async function DonatePage() {
  const user = await requireUser();

  // Members only ever see their own donations.
  const rows = await db
    .select({
      id: donations.id,
      amount: donations.amount,
      currency: donations.currency,
      paymentMethod: donations.paymentMethod,
      status: donations.status,
      rejectionReason: donations.rejectionReason,
      createdAt: donations.createdAt,
      notes: donations.notes,
    })
    .from(donations)
    .where(eq(donations.donorId, user.id))
    .orderBy(desc(donations.createdAt));

  const pastDonations: DonationRow[] = rows.map((d) => ({
    ...d,
    currency: d.currency ?? 'ETB',
    createdAt: d.createdAt?.toISOString() ?? '',
  }));

  return <DonateForm pastDonations={pastDonations} />;
}
