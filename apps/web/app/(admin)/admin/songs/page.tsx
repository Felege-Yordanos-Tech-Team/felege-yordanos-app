import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { asc } from 'drizzle-orm';
import {
  categories as categoriesTable,
  db,
  songs as songsTable,
} from '@felege-yordanos/db/server';
import { canManageSongs } from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import { SongsTable } from './songs-table';

export default async function ManageSongsPage() {
  const user = await requireUser();

  if (!canManageSongs(user)) {
    return (
      <div className="mx-auto max-w-md px-[22px] py-16">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h2 className="mt-2 font-display text-2xl font-medium text-burgundy-ink dark:text-cream">
            Access denied
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Only admins and Songs &amp; Celebrations department heads can manage
            songs.
          </p>
        </div>
      </div>
    );
  }

  const [songs, categories] = await Promise.all([
    db.select().from(songsTable).orderBy(asc(songsTable.number)),
    db.select().from(categoriesTable).orderBy(asc(categoriesTable.sortOrder)),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-[22px] pb-6 pt-4 md:mx-0 md:max-w-none md:px-7 md:py-7">
      {/* Mobile header — desktop header lives in the table's desktop layout */}
      <div className="md:hidden">
        <Link
          href="/admin"
          className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep transition-colors hover:text-burgundy dark:text-gold dark:hover:text-gold-light"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Admin panel
        </Link>

        <div className="font-ethiopic text-xs font-medium tracking-[0.06em] text-gold-deep dark:text-gold">
          መዝሙር አስተዳደር
        </div>
        <h1 className="mt-0.5 font-display text-[28px] font-medium leading-[1.05] text-burgundy-ink dark:text-cream">
          Songs &amp; categories
        </h1>
      </div>

      <SongsTable songs={songs} categories={categories} />
    </div>
  );
}
