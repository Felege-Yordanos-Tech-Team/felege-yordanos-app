import { redirect } from 'next/navigation';
import { canManageNotices, isAdmin } from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import { postableDepartments } from '../form-data';
import { NoticeForm } from '../notice-form';

export default async function NewNoticePage() {
  const user = await requireUser();
  if (!canManageNotices(user)) redirect('/admin');

  return (
    <NoticeForm
      departments={await postableDepartments(user)}
      canPostToEveryone={isAdmin(user)}
    />
  );
}
