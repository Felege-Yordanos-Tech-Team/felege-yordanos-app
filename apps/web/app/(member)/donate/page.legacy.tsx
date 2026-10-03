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
    <DonateForm
      userId={user?.id ?? ''}
      pastDonations={(donations as Donation[]) ?? []}
    />
  );
}
