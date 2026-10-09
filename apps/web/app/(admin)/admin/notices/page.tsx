import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { PageHead } from '@/components/ds';
import { getT } from '@/lib/i18n/server';
import { listNotices } from '@/lib/notice-queries';
import { canEditNotice, canManageNotices, isAdmin } from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import { NoticesList } from './notices-list';

export default async function ManageNoticesPage() {
  const user = await requireUser();
  if (!canManageNotices(user)) redirect('/admin');
  const t = await getT();

  // Admins manage every notice; department heads the ones of their department.
  const all = await listNotices({
    includeExpired: true,
    departmentId: isAdmin(user) ? undefined : user.departmentId,
  });
  const notices = all.filter((n) => canEditNotice(user, n));

  return (
    <div className="mx-auto max-w-4xl px-[22px] pb-6 pt-4 md:mx-0 md:max-w-[1040px] md:px-7 md:py-7">
      <Link
        href="/admin"
        className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep transition-colors hover:text-brand md:hidden dark:hover:text-gold-light"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('Admin panel')}
      </Link>
      <PageHead
        en="Notices"
        am="ማስታወቂያዎች"
        sub={
          isAdmin(user)
            ? 'Post announcements for everyone or for any department.'
            : 'Post announcements for your department.'
        }
        actions={
          <Link
            href="/admin/notices/new"
            className="sacred-gradient inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-gold/40 px-4 py-[9px] text-[13px] font-semibold tracking-[0.04em] text-cream shadow-[0_6px_16px_-6px_rgba(10,60,54,0.4),inset_0_1px_0_rgba(212,168,67,0.25)] transition-opacity hover:opacity-95"
          >
            <Plus className="h-3.5 w-3.5 text-gold" />
            <span className="md:hidden">{t('New')}</span>
            <span className="hidden md:inline">{t('New notice')}</span>
          </Link>
        }
      />
      <NoticesList notices={notices} />
    </div>
  );
}
