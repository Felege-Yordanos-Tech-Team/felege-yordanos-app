import Link from 'next/link';
import { Settings } from 'lucide-react';
import { asc } from 'drizzle-orm';
import {
  categories as categoriesTable,
  db,
  songs as songsTable,
} from '@felege-yordanos/db/server';
import { canManageSongs as canManage } from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import { SongList } from './song-list';
import { SongbookDesktop } from './songbook-desktop';

export default async function SongbookPage() {
  const user = await requireUser();

  const [categories, songs] = await Promise.all([
    db.select().from(categoriesTable).orderBy(asc(categoriesTable.sortOrder)),
    db.select().from(songsTable).orderBy(asc(songsTable.number)),
  ]);

  const canManageSongs = canManage(user);

  const total = songs.length;

  return (
    <>
      {/* ─── MOBILE (< md) — list, taps through to /songbook/[id] ─── */}
      <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-[18px] md:hidden">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <div className="mb-1 font-ethiopic text-xs tracking-[0.06em] text-gold-deep dark:text-gold">
              ሰንበት ት/ቤት
            </div>
            <h1 className="font-ethiopic text-[52px] font-bold leading-[0.95] tracking-tight text-burgundy dark:text-gold">
              መዝሙር
            </h1>
            <p className="mt-0.5 font-display text-base italic text-muted-foreground">
              Songbook
            </p>
          </div>
          <div className="text-right">
            {canManageSongs ? (
              <Link
                href="/admin/songs"
                className="mb-2 inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-burgundy hover:bg-card/80 dark:text-gold"
              >
                <Settings className="h-3.5 w-3.5" />
                Manage
              </Link>
            ) : null}
            <div className="font-mono text-[11px] text-gold-deep dark:text-gold">
              {total}
            </div>
            <div className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              songs
            </div>
          </div>
        </div>

        {/* Ornament rule */}
        <div className="my-[18px] flex items-center gap-2.5">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-parchment-edge dark:to-ink-muted/40" />
          <span className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-gold opacity-40" />
            <span className="h-1 w-1 rounded-full bg-gold" />
            <span className="h-1 w-1 rounded-full bg-gold opacity-40" />
          </span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-parchment-edge dark:to-ink-muted/40" />
        </div>

        <SongList songs={songs} categories={categories} />
      </div>

      {/* ─── DESKTOP (md+) — master/detail with lyrics ─── */}
      <SongbookDesktop
        className="hidden px-7 py-7 md:block"
        songs={songs}
        categories={categories}
      />
    </>
  );
}
