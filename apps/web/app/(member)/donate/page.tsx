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
    <div className="mx-auto max-w-md px-6 py-6">
      <span className="text-secondary font-label text-[10px] tracking-widest uppercase block mb-1">ስጦታ</span>
      <h1 className="font-headline text-3xl text-primary">Make a Donation</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Submit your donation with receipt for verification
      </p>
      <DonateForm
        userId={user?.id ?? ''}
        pastDonations={(donations as Donation[]) ?? []}
      />
    </div>
  );
}
