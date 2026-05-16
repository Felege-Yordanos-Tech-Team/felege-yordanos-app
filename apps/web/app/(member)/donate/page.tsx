import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { DonateForm } from './donate-form';

type Donation = Database['public']['Tables']['donations']['Row'];

export default async function DonatePage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: donations } = await supabase
    .from('donations')
    .select('*')
    .eq('donor_id', user?.id ?? '')
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-md px-[22px] pb-6 pt-4">
      {/* Section header */}
      <div className="mb-1.5">
        <div className="font-ethiopic text-xs font-medium tracking-[0.08em] text-gold-deep dark:text-gold">
          ስጦታ
        </div>
        <h1 className="font-display text-[28px] font-medium leading-[1.05] tracking-tight text-burgundy-ink dark:text-cream">
          Make a donation
        </h1>
      </div>
      <p className="text-[13px] text-muted-foreground">
        Submit your donation with a receipt — admins will verify it.
      </p>

      {/* Ornament rule */}
      <div className="my-4 flex items-center gap-2.5">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-parchment-edge dark:to-ink-muted/40" />
        <span className="flex items-center gap-1">
          <span className="h-1 w-1 rounded-full bg-gold opacity-40" />
          <span className="h-1 w-1 rounded-full bg-gold" />
          <span className="h-1 w-1 rounded-full bg-gold opacity-40" />
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-parchment-edge dark:to-ink-muted/40" />
      </div>

      <DonateForm
        userId={user?.id ?? ''}
        pastDonations={(donations as Donation[]) ?? []}
      />
    </div>
  );
}
