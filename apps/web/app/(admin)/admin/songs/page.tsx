import Link from 'next/link';
import { ArrowLeft, Plus, ShieldAlert } from 'lucide-react';
import { asc } from 'drizzle-orm';
import {
  categories as categoriesTable,
  db,
  songs as songsTable,
} from '@felege-yordanos/db/server';
import { canManageSongs } from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import { getT } from '@/lib/i18n/server';
import { Card, PageHead } from '@/components/ds';
import { SongsTable } from './songs-table';

export default async function ManageSongsPage() {
  const user = await requireUser();
  const t = await getT();

  if (!canManageSongs(user)) {
    return (
      <div className="mx-auto max-w-md px-[22px] py-16">
        <Card className="p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-status-absent" />
          <h2 className="mt-2 font-display text-2xl font-medium text-brand-ink">
            {t('Access denied')}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            {t(
              'Only admins and Songs & Celebrations department heads can manage songs.',
            )}
          </p>
        </Card>
      </div>
    );
  }

  const [songs, categories] = await Promise.all([
    db.select().from(songsTable).orderBy(asc(songsTable.number)),
    db.select().from(categoriesTable).orderBy(asc(categoriesTable.sortOrder)),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-[22px] pb-6 pt-4 md:mx-0 md:max-w-none md:px-7 md:py-7">
      <Link
        href="/admin"
        className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep transition-colors hover:text-brand md:hidden dark:hover:text-gold-light"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('Admin panel')}
      </Link>

      <PageHead
        en="Songs & categories"
        am="መዝሙር አስተዳደር"
        className="mb-0 md:mb-4 max-md:[&_h1]:text-[25px] [&_p]:hidden md:[&_p]:block"
        sub={t('{songs} songs across {categories} categories', {
          songs: songs.length,
          categories: categories.length,
        })}
        actions={
          <Link
            href="/admin/songs/new"
            className="sacred-gradient inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-gold/40 px-4 py-[9px] text-[13px] font-semibold tracking-[0.04em] text-cream shadow-[0_6px_16px_-6px_rgba(10,60,54,0.4),inset_0_1px_0_rgba(212,168,67,0.25)] transition-opacity hover:opacity-95"
          >
            <Plus className="h-3.5 w-3.5 text-gold" />
            <span className="md:hidden">{t('Song')}</span>
            <span className="hidden md:inline">{t('New song')}</span>
          </Link>
        }
      />

      <SongsTable songs={songs} categories={categories} />
    </div>
  );
}
