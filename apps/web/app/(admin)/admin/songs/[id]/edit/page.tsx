import { notFound, redirect } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { categories, db, songs } from '@felege-yordanos/db/server';
import { canManageSongs } from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import { SongForm } from '../../song-form';

export default async function EditSongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  // Same as before: /admin/songs shows the access-denied message.
  if (!canManageSongs(user)) redirect('/admin/songs');

  // Song ids are uuids; anything else cannot match (and would make Postgres throw).
  if (!z.uuid().safeParse(id).success) notFound();

  const [[song], categoryRows] = await Promise.all([
    db.select().from(songs).where(eq(songs.id, id)).limit(1),
    db.select().from(categories).orderBy(asc(categories.sortOrder)),
  ]);
  if (!song) notFound();

  return <SongForm categories={categoryRows} song={song} />;
}
