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
    <div className="mx-auto max-w-md px-6 py-6">
      <span className="text-secondary font-label text-[10px] tracking-widest uppercase block mb-1">የግል መረጃ</span>
      <h1 className="font-headline text-3xl text-primary">Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your account settings
      </p>
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
