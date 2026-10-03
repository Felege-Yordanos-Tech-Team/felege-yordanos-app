import Link from 'next/link';
import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
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
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4 md:mx-0 md:max-w-none md:px-7 md:py-7">
      {/* Mobile header + totals — desktop header lives in the table */}
      <div className="md:hidden">
        <Link
          href="/admin"
          className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep transition-colors hover:text-burgundy dark:text-gold dark:hover:text-gold-light"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Admin panel
        </Link>

        <div className="font-ethiopic text-xs font-medium tracking-[0.06em] text-gold-deep dark:text-gold">
          ስጦታዎች
        </div>
        <h1 className="mt-0.5 font-display text-[28px] font-medium leading-[1.05] text-burgundy-ink dark:text-cream">
          Verify donations
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Review submitted donations against bank statements
        </p>

        {/* Totals strip */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div
            className="rounded-xl px-3.5 py-3"
            style={{
              background: 'var(--status-late-bg, #F6E3C5)',
              border: '1px solid rgba(201,123,26,0.25)',
            }}
          >
            <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-status-late">
              Pending review
            </div>
            <div className="mt-1 font-display text-[26px] font-medium leading-none tabular-nums text-status-late">
              {totals.pendingAmt.toLocaleString()}{' '}
              <span className="font-mono text-[11px] text-muted-foreground">
                {currency}
              </span>
            </div>
            <div className="mt-1 text-[10px] text-status-late/80">
              {totals.pendingCount}{' '}
              {totals.pendingCount === 1 ? 'donor' : 'donors'}
            </div>
          </div>
          <div
            className="rounded-xl px-3.5 py-3"
            style={{
              background: 'var(--status-present-bg, #E4EED9)',
              border: '1px solid rgba(79,123,62,0.25)',
            }}
          >
            <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-status-present">
              Verified · this week
            </div>
            <div className="mt-1 font-display text-[26px] font-medium leading-none tabular-nums text-status-present">
              {totals.verifiedAmt.toLocaleString()}{' '}
              <span className="font-mono text-[11px] text-muted-foreground">
                {currency}
              </span>
            </div>
            <div className="mt-1 text-[10px] text-status-present/80">
              {totals.verifiedDonors}{' '}
              {totals.verifiedDonors === 1 ? 'donor' : 'donors'}
            </div>
          </div>
        </div>
      </div>

      <DonationsTable donations={list} profileMap={profileMap} />
    </div>
  );
}
