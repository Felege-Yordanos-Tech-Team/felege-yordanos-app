import Link from 'next/link';
import { asc, eq } from 'drizzle-orm';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import {
  authUsers,
  db,
  departments,
  profiles,
} from '@felege-yordanos/db/server';
import { canManageUsers, canViewAllProfiles } from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import { UsersTable } from './users-table';

export default async function ManageUsersPage() {
  const user = await requireUser();

  // Same as before: only super admins can open this screen.
  if (!canManageUsers(user) || !canViewAllProfiles(user)) {
    return (
      <div className="mx-auto max-w-md px-[22px] py-16">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h2 className="mt-2 font-display text-2xl font-medium text-burgundy-ink dark:text-cream">
            Access denied
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Only super admins can manage user roles.
          </p>
        </div>
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
      })
      .from(profiles)
      .leftJoin(authUsers, eq(authUsers.id, profiles.id))
      .orderBy(asc(profiles.createdAt)),
    db
      .select({ id: departments.id, nameAm: departments.nameAm })
      .from(departments)
      .orderBy(asc(departments.id)),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4 md:mx-0 md:max-w-none md:px-7 md:py-7">
      {/* Mobile header — desktop header lives in the table's desktop layout */}
      <div className="md:hidden">
        <Link
          href="/admin"
          className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep transition-colors hover:text-burgundy dark:text-gold dark:hover:text-gold-light"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Admin panel
        </Link>

        <div className="font-ethiopic text-xs font-medium tracking-[0.06em] text-gold-deep dark:text-gold">
          የተጠቃሚ አስተዳደር
        </div>
        <h1 className="mt-0.5 font-display text-[28px] font-medium leading-[1.05] text-burgundy-ink dark:text-cream">
          Manage users
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Assign roles and departments · super admin only
        </p>
      </div>

      <UsersTable profiles={profileRows} departments={departmentRows} />
    </div>
  );
}
