import { redirect } from 'next/navigation';
import { asc } from 'drizzle-orm';
import { categories, db } from '@felege-yordanos/db/server';
import { canManageSongs } from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import { SongForm } from '../song-form';

export default async function NewSongPage() {
  const user = await requireUser();
  // Same as before: /admin/songs shows the access-denied message.
  if (!canManageSongs(user)) redirect('/admin/songs');

  const rows = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder));

  return <SongForm categories={rows} />;
}
