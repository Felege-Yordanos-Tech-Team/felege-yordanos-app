import { and, asc, desc, eq, isNull, notExists, sql } from 'drizzle-orm';
import { ShieldAlert } from 'lucide-react';
import {
  authUsers,
  db,
  memberLinkRequests,
  members,
  profiles,
} from '@felege-yordanos/db/server';
import { Card, PageHead } from '@/components/ds';
import { getT } from '@/lib/i18n/server';
import { canApproveMemberLinks } from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import { MemberLinks } from './member-links';

/** Last 4 digits of a phone number, so admins can confirm without seeing it all. */
const last4 = (phone: string | null) => {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : null;
};

const fullName = (m: {
  name: string | null;
  fatherName: string | null;
  grandfatherName: string | null;
}) => [m.name, m.fatherName, m.grandfatherName].filter(Boolean).join(' ');

export default async function MemberLinksPage() {
  const user = await requireUser();
  const t = await getT();

  if (!canApproveMemberLinks(user)) {
    return (
      <div className="mx-auto max-w-md px-[22px] py-16">
        <Card className="p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-status-absent" />
          <h2 className="mt-2 font-display text-2xl font-medium text-brand-ink">
            {t('Access denied')}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            {t('Only admins can approve member links.')}
          </p>
        </Card>
      </div>
    );
  }

  const pendingRequest = db
    .select({ one: sql`1` })
    .from(memberLinkRequests)
    .where(
      and(
        eq(memberLinkRequests.userId, profiles.id),
        eq(memberLinkRequests.status, 'pending'),
      ),
    );

  const [pendingRows, unlinkedRows, linkedRows] = await Promise.all([
    db
      .select({
        requestId: memberLinkRequests.id,
        requestedAt: memberLinkRequests.createdAt,
        userId: memberLinkRequests.userId,
        accountName: profiles.displayName,
        email: authUsers.email,
        memberId: members.memberId,
        name: members.name,
        fatherName: members.fatherName,
        grandfatherName: members.grandfatherName,
        phone: members.addressPhone,
        gender: members.gender,
      })
      .from(memberLinkRequests)
      .innerJoin(members, eq(members.id, memberLinkRequests.memberId))
      .innerJoin(authUsers, eq(authUsers.id, memberLinkRequests.userId))
      .leftJoin(profiles, eq(profiles.id, memberLinkRequests.userId))
      .where(eq(memberLinkRequests.status, 'pending'))
      .orderBy(asc(memberLinkRequests.createdAt)),
    db
      .select({
        userId: profiles.id,
        accountName: profiles.displayName,
        email: authUsers.email,
        createdAt: authUsers.createdAt,
      })
      .from(profiles)
      .innerJoin(authUsers, eq(authUsers.id, profiles.id))
      .leftJoin(members, eq(members.authUserId, profiles.id))
      .where(and(isNull(members.id), notExists(pendingRequest)))
      .orderBy(desc(authUsers.createdAt))
      .limit(300),
    db
      .select({
        userId: profiles.id,
        accountName: profiles.displayName,
        email: authUsers.email,
        memberId: members.memberId,
        linkedAt: members.updatedAt,
      })
      .from(members)
      .innerJoin(profiles, eq(profiles.id, members.authUserId))
      .innerJoin(authUsers, eq(authUsers.id, profiles.id))
      .orderBy(desc(members.updatedAt))
      .limit(300),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-[22px] pb-6 pt-4 md:mx-0 md:max-w-none md:px-7 md:py-7">
      <PageHead
        en="Member links"
        am="የአባልነት ማገናኛዎች"
        sub="Confirm which account belongs to which member"
      />
      <MemberLinks
        pending={pendingRows.map((r) => ({
          requestId: r.requestId,
          requestedAt: r.requestedAt?.toISOString() ?? '',
          userId: r.userId,
          accountName: r.accountName,
          email: r.email,
          memberId: r.memberId,
          memberName: fullName(r),
          phoneLast4: last4(r.phone),
          gender: r.gender,
        }))}
        unlinked={unlinkedRows.map((r) => ({
          userId: r.userId,
          accountName: r.accountName,
          email: r.email,
          createdAt: r.createdAt?.toISOString() ?? '',
        }))}
        linked={linkedRows.map((r) => ({
          userId: r.userId,
          accountName: r.accountName,
          email: r.email,
          memberId: r.memberId,
        }))}
      />
    </div>
  );
}
