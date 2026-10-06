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
import { getT } from '@/lib/i18n/server';
import { SongList } from './song-list';
import { SongbookDesktop } from './songbook-desktop';

export default async function SongbookPage() {
  const user = await requireUser();
  const t = await getT();

  const [categories, songs] = await Promise.all([
    db.select().from(categoriesTable).orderBy(asc(categoriesTable.sortOrder)),
    db.select().from(songsTable).orderBy(asc(songsTable.number)),
  ]);

  const canManageSongs = canManage(user);

  const total = songs.length;

  return (
    <>
      {/* ─── PHONE (< md): list, taps through to /songbook/[id] ─── */}
      <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-[18px] md:hidden">
        <div className="mb-1.5 flex items-end justify-between">
          <div>
            <div className="font-ethiopic text-xs tracking-[0.06em] text-gold-deep">
              ሰንበት ት/ቤት
            </div>
            <h1 className="mt-1 font-ethiopic text-[52px] font-bold leading-[0.95] tracking-[-0.01em] text-brand dark:text-gold">
              መዝሙር
            </h1>
            <p className="mt-0.5 font-display text-base italic text-ink-muted">
              Songbook
            </p>
          </div>
          <div className="flex flex-col items-end">
            {canManageSongs ? (
              <Link
                href="/admin/songs"
                className="mb-2 inline-flex items-center gap-1 rounded-full border border-parchment-edge bg-parchment-soft px-3 py-1.5 text-[11px] font-semibold text-brand transition-colors hover:bg-parchment-deep dark:text-gold"
              >
                <Settings className="h-3.5 w-3.5" />
                {t('Manage')}
              </Link>
            ) : null}
            <div className="font-mono text-[11px] text-gold-deep">{total}</div>
            <div className="text-[9px] uppercase tracking-[0.16em] text-ink-muted">
              {t('songs')}
            </div>
          </div>
        </div>

        {/* Ornament rule */}
        <div className="mb-[18px] mt-3.5 flex items-center gap-2.5" aria-hidden>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-parchment-edge" />
          <span className="flex items-center gap-[3.6px]">
            <span className="h-[3px] w-[3px] rounded-full bg-gold opacity-40" />
            <span className="h-[3px] w-[3px] rounded-full bg-gold" />
            <span className="h-[3px] w-[3px] rounded-full bg-gold opacity-40" />
          </span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-parchment-edge" />
        </div>

        <SongList songs={songs} categories={categories} />
      </div>

      {/* ─── DESKTOP (md+): list pane + lyrics detail ─── */}
      <SongbookDesktop
        className="hidden px-7 py-7 md:block"
        songs={songs}
        categories={categories}
      />
    </>
  );
}
