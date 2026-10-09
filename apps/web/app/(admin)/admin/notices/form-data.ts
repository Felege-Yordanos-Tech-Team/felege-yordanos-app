import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { db, departments } from '@felege-yordanos/db/server';
import { isAdmin } from '@/lib/permissions';
import type { CurrentUser } from '@/lib/session';

/** Departments a user may post notices to: all for admins, else their own. */
export async function postableDepartments(user: CurrentUser) {
  const query = db
    .select({
      id: departments.id,
      nameEn: departments.nameEn,
      nameAm: departments.nameAm,
    })
    .from(departments)
    .orderBy(asc(departments.id));
  if (isAdmin(user)) return query;
  if (user.departmentId == null) return [];
  return query.where(eq(departments.id, user.departmentId));
}
