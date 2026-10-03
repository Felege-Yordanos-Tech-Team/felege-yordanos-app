import { eq } from 'drizzle-orm';
import { db, departments, members, profiles } from '@felege-yordanos/db/server';
import { requireUser } from '@/lib/session';
import { ProfileForm } from './profile-form';

export default async function ProfilePage() {
  const user = await requireUser();

  const [[profile], [member]] = await Promise.all([
    db
      .select({ displayName: profiles.displayName })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1),
    // The member record linked to this account through /claim.
    db
      .select({
        memberId: members.memberId,
        name: members.name,
        fatherName: members.fatherName,
        grandfatherName: members.grandfatherName,
        gender: members.gender,
        addressPhone: members.addressPhone,
      })
      .from(members)
      .where(eq(members.authUserId, user.id))
      .limit(1),
  ]);

  let deptName: string | null = null;
  if (user.departmentId != null) {
    const [dept] = await db
      .select({ nameAm: departments.nameAm })
      .from(departments)
      .where(eq(departments.id, user.departmentId))
      .limit(1);
    deptName = dept?.nameAm ?? null;
  }

  return (
    <div className="mx-auto max-w-md px-[22px] pb-6 pt-4 md:mx-0 md:max-w-none md:px-7 md:py-7">
      {/* Mobile header — the desktop header lives in the form's desktop layout */}
      <div className="md:hidden">
        <div className="font-ethiopic text-xs font-medium tracking-[0.06em] text-gold-deep dark:text-gold">
          መገለጫዬ
        </div>
        <h1 className="mt-0.5 font-display text-[28px] font-medium leading-[1.05] text-burgundy-ink dark:text-cream">
          My profile
        </h1>
      </div>

      <ProfileForm
        email={user.email}
        displayName={profile?.displayName ?? ''}
        role={user.role}
        member={member ?? null}
        deptName={deptName}
      />
    </div>
  );
}
