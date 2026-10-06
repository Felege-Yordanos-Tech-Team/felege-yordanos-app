import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { db, donations, profiles } from '@felege-yordanos/db/server';
import { canReviewDonations } from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import { receiptUrl } from '@/lib/storage';
import { DonationsTable, type DonationRow } from './donations-table';

export default async function VerifyDonationsPage() {
  const user = await requireUser();
  if (!canReviewDonations(user)) redirect('/dashboard');

  const rows = await db
    .select({
      id: donations.id,
      donorId: donations.donorId,
      amount: donations.amount,
      currency: donations.currency,
      paymentMethod: donations.paymentMethod,
      receiptUrl: donations.receiptUrl,
      notes: donations.notes,
      status: donations.status,
      rejectionReason: donations.rejectionReason,
      createdAt: donations.createdAt,
      verifiedAt: donations.verifiedAt,
      donorProfileId: profiles.id,
      donorName: profiles.displayName,
    })
    .from(donations)
    .leftJoin(profiles, eq(profiles.id, donations.donorId))
    .orderBy(desc(donations.createdAt));

  const profileMap: Record<string, string> = {};
  for (const d of rows) {
    if (d.donorProfileId)
      profileMap[d.donorId] = d.donorName || d.donorId.slice(0, 8);
  }

  const list: DonationRow[] = rows.map((d) => ({
    id: d.id,
    donorId: d.donorId,
    amount: d.amount,
    currency: d.currency ?? 'ETB',
    paymentMethod: d.paymentMethod,
    receiptHref: d.receiptUrl ? receiptUrl(d.receiptUrl) : null,
    notes: d.notes,
    status: d.status,
    rejectionReason: d.rejectionReason,
    createdAt: d.createdAt?.toISOString() ?? '',
  }));

  // Aggregates for the totals strip
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const pendingList = rows.filter((d) => d.status === 'pending');
  const verifiedThisWeek = rows.filter(
    (d) =>
      d.status === 'verified' &&
      (d.verifiedAt ?? d.createdAt ?? new Date(0)).getTime() >= sevenDaysAgo,
  );

  const totals = {
    pendingAmt: pendingList.reduce((a, b) => a + Number(b.amount), 0),
    pendingCount: pendingList.length,
    verifiedAmt: verifiedThisWeek.reduce((a, b) => a + Number(b.amount), 0),
    verifiedDonors: new Set(verifiedThisWeek.map((d) => d.donorId)).size,
  };

  const currency = list[0]?.currency || 'ETB';

  return (
    <DonationsTable
      donations={list}
      profileMap={profileMap}
      totals={totals}
      currency={currency}
    />
  );
}
