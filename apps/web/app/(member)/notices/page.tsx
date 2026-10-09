import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { PageHead } from '@/components/ds';
import { getT } from '@/lib/i18n/server';
import { listNotices } from '@/lib/notice-queries';
import {
  canManageNotices,
  canSeeExpiredNotices,
  canViewNotices,
} from '@/lib/permissions';
import { requireLinkedMember } from '@/lib/session';
import { NoticeBoard } from './notice-board';

export default async function NoticesPage() {
  const user = await requireLinkedMember();
  if (!canViewNotices(user)) redirect('/dashboard');
  const [t, notices] = await Promise.all([
    getT(),
    listNotices({ includeExpired: canSeeExpiredNotices(user) }),
  ]);

  return (
    <div className="mx-auto max-w-[920px] px-[22px] pb-6 pt-4 md:mx-0 md:px-7 md:py-7">
      <PageHead
        en="Notice board"
        am="የማስታወቂያ ሰሌዳ"
        sub="Announcements from the parish council and departments"
        actions={
          canManageNotices(user) ? (
            <Link
              href="/admin/notices/new"
              className="sacred-gradient inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-gold/40 px-4 py-[9px] text-[13px] font-semibold tracking-[0.04em] text-cream shadow-[0_6px_16px_-6px_rgba(10,60,54,0.4),inset_0_1px_0_rgba(212,168,67,0.25)] transition-opacity hover:opacity-95"
            >
              <Plus className="h-3.5 w-3.5 text-gold" />
              <span className="md:hidden">{t('New')}</span>
              <span className="hidden md:inline">{t('New notice')}</span>
            </Link>
          ) : undefined
        }
      />
      <NoticeBoard notices={notices} />
    </div>
  );
}
