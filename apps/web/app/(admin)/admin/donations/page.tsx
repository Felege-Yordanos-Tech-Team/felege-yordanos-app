import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { DonationsTable } from './donations-table';

type Donation = Database['public']['Tables']['donations']['Row'];
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

  // Fetch donor profiles for display names
  const donorIds = [...new Set((donations as Donation[] ?? []).map((d) => d.donor_id))];
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

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <span className="text-secondary font-label text-[10px] tracking-widest uppercase block mb-1">ስጦታዎች</span>
      <h1 className="font-headline text-3xl text-primary">Verify Donations</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Review and verify submitted donations
      </p>
      <DonationsTable
        donations={(donations as Donation[]) ?? []}
        profileMap={profileMap}
        userId={user?.id ?? ''}
      />
    </div>
  );
}
