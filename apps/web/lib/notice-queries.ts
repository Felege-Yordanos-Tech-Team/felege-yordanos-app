/**
 * Notice board reads, shared by /notices, the dashboard and /admin/notices.
 * Callers check the permission rules (lib/permissions.ts) first.
 */
import 'server-only';
import {
  and,
  desc,
  eq,
  gt,
  isNull,
  or,
  type SQL,
} from 'drizzle-orm';
import {
  db,
  departments,
  members,
  notices,
  profiles,
} from '@felege-yordanos/db/server';
import type { NoticeView } from './notices';

export async function listNotices({
  includeExpired,
  departmentId,
  limit,
}: {
  /** Staff see expired notices too (canSeeExpiredNotices). */
  includeExpired: boolean;
  /** undefined = all, null = only "Everyone", a number = that department. */
  departmentId?: number | null;
  limit?: number;
}): Promise<NoticeView[]> {
  const now = new Date();
  const where: SQL[] = [];
  const active = or(isNull(notices.expiresAt), gt(notices.expiresAt, now));
  if (!includeExpired && active) where.push(active);
  if (departmentId === null) where.push(isNull(notices.departmentId));
  else if (departmentId !== undefined)
    where.push(eq(notices.departmentId, departmentId));

  const query = db
    .select({
      notice: notices,
      departmentNameEn: departments.nameEn,
      departmentNameAm: departments.nameAm,
      profileName: profiles.displayName,
      memberName: members.name,
      memberFatherName: members.fatherName,
    })
    .from(notices)
    .leftJoin(departments, eq(departments.id, notices.departmentId))
    .leftJoin(profiles, eq(profiles.id, notices.createdBy))
    .leftJoin(members, eq(members.authUserId, notices.createdBy))
    .where(and(...where))
    .orderBy(desc(notices.pinned), desc(notices.createdAt))
    .$dynamic();
  const rows = await (limit ? query.limit(limit) : query);

  return rows.map((r) => {
    const n = r.notice;
    // Same name rule as getCurrentUser: profile name, else the member register.
    const profileName = r.profileName?.includes('@') ? null : r.profileName;
    const memberName = [r.memberName, r.memberFatherName]
      .filter(Boolean)
      .join(' ');
    return {
      id: n.id,
      title: n.title,
      body: n.body,
      departmentId: n.departmentId,
      departmentNameEn: r.departmentNameEn,
      departmentNameAm: r.departmentNameAm,
      imageKey: n.imageKey,
      pinned: n.pinned,
      expiresAt: n.expiresAt?.toISOString() ?? null,
      expired: !!n.expiresAt && n.expiresAt <= now,
      createdAt: n.createdAt.toISOString(),
      authorName: profileName?.trim() || memberName || null,
    };
  });
}
