import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import { SongList } from './song-list';

export default async function SongbookPage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');

  const { data: songs } = await supabase
    .from('songs')
    .select('*')
    .order('number');

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <span className="text-secondary font-label text-[10px] tracking-widest uppercase block mb-1">ሰንበት ት/ቤት</span>
      <h1 className="font-headline text-5xl text-primary leading-tight">
        <span className="font-ethiopic">መዝሙር</span>
      </h1>
      <h2 className="font-headline text-3xl text-primary/60 -mt-1">Songbook</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Explore our collection of sacred hymns and spiritual songs
      </p>
      <SongList
        songs={songs ?? []}
        categories={categories ?? []}
      />
    </div>
  );
}
