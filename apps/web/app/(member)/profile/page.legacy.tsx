import { cookies } from 'next/headers';
import { createServerComponentClient, getLinkedMember } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { ProfileForm } from './profile-form';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Department = Database['public']['Tables']['departments']['Row'];

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data }, { data: departmentsData }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user?.id ?? '').single(),
    supabase.from('departments').select('*').order('id'),
  ]);

  const profile = data as Profile | null;
  const departments = (departmentsData ?? []) as Department[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const member = await getLinkedMember(supabase as any, user?.id ?? '');

  const deptName = profile?.department_id
    ? departments.find((d) => d.id === profile.department_id)?.name_am ?? null
    : null;

  return (
    <div className="mx-auto max-w-md px-[22px] pb-6 pt-4 md:mx-0 md:max-w-none md:px-7 md:py-7">
      {/* Mobile header — the desktop header lives in the form's desktop layout */}
      <div className="md:hidden">
        <div className="font-ethiopic text-xs font-medium tracking-[0.06em] text-gold-deep dark:text-gold">
          መገለጫዬ
        </div>
        <h1 className="mt-0.5 font-display text-[28px] font-medium leading-[1.05] text-burgundy-ink dark:text-cream">
          My profile
        </h1>
      </div>

      <ProfileForm
        profileId={user?.id ?? ''}
        email={user?.email ?? ''}
        displayName={profile?.display_name ?? ''}
        role={profile?.role ?? 'member'}
        member={member}
        deptName={deptName}
      />
    </div>
  );
}
