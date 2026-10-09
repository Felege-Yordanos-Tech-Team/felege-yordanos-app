import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, notices } from '@felege-yordanos/db/server';
import { canEditNotice, canManageNotices, isAdmin } from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import { postableDepartments } from '../../form-data';
import { NoticeForm } from '../../notice-form';

export default async function EditNoticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  if (!canManageNotices(user)) redirect('/admin');

  // Notice ids are uuids; anything else cannot match (and would make Postgres throw).
  if (!z.uuid().safeParse(id).success) notFound();

  const [notice] = await db
    .select()
    .from(notices)
    .where(eq(notices.id, id))
    .limit(1);
  if (!notice) notFound();
  if (!canEditNotice(user, notice)) redirect('/admin/notices');

  return (
    <NoticeForm
      notice={{
        id: notice.id,
        title: notice.title,
        body: notice.body,
        departmentId: notice.departmentId,
        imageKey: notice.imageKey,
        pinned: notice.pinned,
        expiresAt: notice.expiresAt?.toISOString() ?? null,
      }}
      departments={await postableDepartments(user)}
      canPostToEveryone={isAdmin(user)}
    />
  );
}
