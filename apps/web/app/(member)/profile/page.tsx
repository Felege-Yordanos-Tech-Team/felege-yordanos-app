import { cookies } from 'next/headers';
import { createServerComponentClient, getLinkedMember } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { ProfileForm } from './profile-form';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .single();

  const profile = data as Profile | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const member = await getLinkedMember(supabase as any, user?.id ?? '');

  return (
    <div className="mx-auto max-w-md px-[22px] pb-6 pt-4">
      <div className="font-ethiopic text-xs font-medium tracking-[0.06em] text-gold-deep dark:text-gold">
        መገለጫዬ
      </div>
      <h1 className="mt-0.5 font-display text-[28px] font-medium leading-[1.05] text-burgundy-ink dark:text-cream">
        My profile
      </h1>

      <ProfileForm
        profileId={user?.id ?? ''}
        email={user?.email ?? ''}
        displayName={profile?.display_name ?? ''}
        role={profile?.role ?? 'member'}
        member={member}
      />
    </div>
  );
}
