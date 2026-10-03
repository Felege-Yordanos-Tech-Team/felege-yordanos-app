import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { redirect } from 'next/navigation';
import { SongForm } from '../song-form';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export default async function NewSongPage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profileData }, { data: categories }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user?.id ?? '').single(),
    supabase.from('categories').select('*').order('sort_order'),
  ]);

  const profile = profileData as Profile | null;
  const canManage =
    profile?.role === 'admin' ||
    profile?.role === 'super_admin' ||
    (profile?.role === 'dept_head' && profile?.department_id === 6);

  if (!canManage) redirect('/admin/songs');

  return <SongForm categories={(categories as Category[]) ?? []} />;
}
