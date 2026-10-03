import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { redirect, notFound } from 'next/navigation';
import { SongForm } from '../../song-form';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Song = Database['public']['Tables']['songs']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export default async function EditSongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profileData }, { data: songData }, { data: categories }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user?.id ?? '').single(),
    supabase.from('songs').select('*').eq('id', id).single(),
    supabase.from('categories').select('*').order('sort_order'),
  ]);

  const profile = profileData as Profile | null;
  const canManage =
    profile?.role === 'admin' ||
    profile?.role === 'super_admin' ||
    (profile?.role === 'dept_head' && profile?.department_id === 6);

  if (!canManage) redirect('/admin/songs');

  const song = songData as Song | null;
  if (!song) notFound();

  return <SongForm categories={(categories as Category[]) ?? []} song={song} />;
}
