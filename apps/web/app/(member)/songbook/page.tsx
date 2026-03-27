import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SongList } from './song-list';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default async function SongbookPage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const [{ data: { user } }, { data: categories }, { data: songs }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('songs').select('*').order('number'),
  ]);

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .single();

  const profile = profileData as Profile | null;
  const canManageSongs =
    profile?.role === 'admin' ||
    profile?.role === 'super_admin' ||
    (profile?.role === 'dept_head' && String(profile?.department_id) === '6');

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-secondary font-label text-[10px] tracking-widest uppercase block mb-1">ሰንበት ት/ቤት</span>
          <h1 className="font-headline text-5xl text-primary leading-tight">
            <span className="font-ethiopic">መዝሙር</span>
          </h1>
        </div>
        {canManageSongs && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/songs">
              <Settings className="mr-1 h-4 w-4" />
              Manage Songs
            </Link>
          </Button>
        )}
      </div>
      <SongList
        songs={songs ?? []}
        categories={categories ?? []}
      />
    </div>
  );
}
