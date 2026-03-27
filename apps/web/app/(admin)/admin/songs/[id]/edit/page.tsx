import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    (profile?.role === 'dept_head' && String(profile?.department_id) === '6');

  if (!canManage) redirect('/admin/songs');

  const song = songData as Song | null;
  if (!song) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/admin/songs">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to songs
        </Link>
      </Button>
      <SongForm
        categories={(categories as Category[]) ?? []}
        song={song}
      />
    </div>
  );
}
