import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DonationsTable } from './donations-table';

type Donation = Database['public']['Tables']['donations']['Row'] & {
  verified_at?: string | null;
};
type Profile = Database['public']['Tables']['profiles']['Row'];

export default async function VerifyDonationsPage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: donations } = await supabase
    .from('donations')
    .select('*')
    .order('created_at', { ascending: false });

  const list = (donations as Donation[]) ?? [];

  const donorIds = [...new Set(list.map((d) => d.donor_id))];
  const { data: profiles } = donorIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', donorIds)
    : { data: [] };

  const profileMap: Record<string, string> = {};
  for (const p of (profiles as Pick<Profile, 'id' | 'display_name'>[] ?? [])) {
    profileMap[p.id] = p.display_name || p.id.slice(0, 8);
  }

  // Aggregates for the totals strip
  const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const pendingList = list.filter((d) => d.status === 'pending');
  const verifiedThisWeek = list.filter(
    (d) => d.status === 'verified' && (d.verified_at ?? d.created_at) >= sevenDaysAgoIso,
  );

  const totals = {
    pendingAmt: pendingList.reduce((a, b) => a + Number(b.amount), 0),
    pendingCount: pendingList.length,
    verifiedAmt: verifiedThisWeek.reduce((a, b) => a + Number(b.amount), 0),
    verifiedDonors: new Set(verifiedThisWeek.map((d) => d.donor_id)).size,
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
          style={{ background: 'var(--status-late-bg, #F6E3C5)', border: '1px solid rgba(201,123,26,0.25)' }}
        >
          <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-status-late">
            Pending review
          </div>
          <div className="mt-1 font-display text-[26px] font-medium leading-none tabular-nums text-status-late">
            {totals.pendingAmt.toLocaleString()}{' '}
            <span className="font-mono text-[11px] text-muted-foreground">{currency}</span>
          </div>
          <div className="mt-1 text-[10px] text-status-late/80">
            {totals.pendingCount} {totals.pendingCount === 1 ? 'donor' : 'donors'}
          </div>
        </div>
        <div
          className="rounded-xl px-3.5 py-3"
          style={{ background: 'var(--status-present-bg, #E4EED9)', border: '1px solid rgba(79,123,62,0.25)' }}
        >
          <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-status-present">
            Verified · this week
          </div>
          <div className="mt-1 font-display text-[26px] font-medium leading-none tabular-nums text-status-present">
            {totals.verifiedAmt.toLocaleString()}{' '}
            <span className="font-mono text-[11px] text-muted-foreground">{currency}</span>
          </div>
          <div className="mt-1 text-[10px] text-status-present/80">
            {totals.verifiedDonors} {totals.verifiedDonors === 1 ? 'donor' : 'donors'}
          </div>
        </div>
      </div>
      </div>

      <DonationsTable
        donations={list}
        profileMap={profileMap}
        userId={user?.id ?? ''}
      />
    </div>
  );
}
