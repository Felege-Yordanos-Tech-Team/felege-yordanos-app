import Link from 'next/link';
import { asc, eq } from 'drizzle-orm';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import {
  authUsers,
  db,
  departments,
  members,
  profiles,
} from '@felege-yordanos/db/server';
import { Card, PageHead } from '@/components/ds';
import { getT } from '@/lib/i18n/server';
import { canManageUsers, canViewAllProfiles } from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import { UsersTable } from './users-table';

export default async function ManageUsersPage() {
  const user = await requireUser();
  const t = await getT();

  // Same as before: only super admins can open this screen.
  if (!canManageUsers(user) || !canViewAllProfiles(user)) {
    return (
      <div className="mx-auto max-w-md px-[22px] py-16">
        <Card className="p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-status-absent" />
          <h2 className="mt-2 font-display text-2xl font-medium text-brand-ink">
            {t('Access denied')}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            {t('Only super admins can manage user roles.')}
          </p>
        </Card>
      </div>
    );
  }

  const [profileRows, departmentRows] = await Promise.all([
    db
      .select({
        id: profiles.id,
        displayName: profiles.displayName,
        email: authUsers.email,
        role: profiles.role,
        departmentId: profiles.departmentId,
        memberCode: members.memberId,
      })
      .from(profiles)
      .leftJoin(authUsers, eq(authUsers.id, profiles.id))
      .leftJoin(members, eq(members.authUserId, profiles.id))
      .orderBy(asc(profiles.createdAt)),
    db
      .select({
        id: departments.id,
        nameAm: departments.nameAm,
        nameEn: departments.nameEn,
      })
      .from(departments)
      .orderBy(asc(departments.id)),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4 md:mx-0 md:max-w-none md:px-7 md:py-7">
      {/* Phone: back link + head */}
      <Link
        href="/admin"
        className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep transition-colors hover:text-brand md:hidden"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('Admin panel')}
      </Link>
      <PageHead
        en="Manage users"
        am="የተጠቃሚ አስተዳደር"
        sub="Assign roles and departments · super admin only"
        className="mb-0 md:hidden"
      />
      {/* Desktop head */}
      <PageHead
        en="Manage users"
        am="የተጠቃሚ አስተዳደር"
        sub="Roles and department assignments"
        className="hidden md:flex"
      />

      <UsersTable profiles={profileRows} departments={departmentRows} />
    </div>
  );
}
