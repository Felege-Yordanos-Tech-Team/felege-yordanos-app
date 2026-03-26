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
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold">Songbook</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Browse and search songs by category
      </p>
      <SongList
        songs={songs ?? []}
        categories={categories ?? []}
      />
    </div>
  );
}
