import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import { SongList } from './song-list';

export default async function SongbookPage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const [{ data: categories }, { data: songs }] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('songs').select('*').order('number'),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <span className="text-secondary font-label text-[10px] tracking-widest uppercase block mb-1">ሰንበት ት/ቤት</span>
      <h1 className="font-headline text-5xl text-primary leading-tight">
        <span className="font-ethiopic">መዝሙር</span>
      </h1>
      <SongList
        songs={songs ?? []}
        categories={categories ?? []}
      />
    </div>
  );
}
