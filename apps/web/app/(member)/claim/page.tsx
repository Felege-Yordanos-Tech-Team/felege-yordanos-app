import { desc, eq } from 'drizzle-orm';
import { db, memberLinkRequests, members } from '@felege-yordanos/db/server';
import { PageHead } from '@/components/ds';
import { requireUser } from '@/lib/session';
import { ClaimForm, type ClaimState } from './claim-form';

export default async function ClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ required?: string }>;
}) {
  const user = await requireUser();
  const { required } = await searchParams;

  let state: ClaimState = { kind: 'none' };
  if (user.memberRecordId !== null) {
    const [m] = await db
      .select({ memberId: members.memberId })
      .from(members)
      .where(eq(members.id, user.memberRecordId))
      .limit(1);
    state = { kind: 'linked', memberId: m?.memberId ?? '' };
  } else {
    // The account's latest request decides what the page shows.
    const [latest] = await db
      .select({
        status: memberLinkRequests.status,
        note: memberLinkRequests.note,
        createdAt: memberLinkRequests.createdAt,
        memberId: members.memberId,
      })
      .from(memberLinkRequests)
      .innerJoin(members, eq(members.id, memberLinkRequests.memberId))
      .where(eq(memberLinkRequests.userId, user.id))
      .orderBy(desc(memberLinkRequests.createdAt))
      .limit(1);
    if (latest?.status === 'pending') {
      state = {
        kind: 'pending',
        memberId: latest.memberId,
        requestedAt: latest.createdAt?.toISOString() ?? '',
      };
    } else if (latest?.status === 'rejected') {
      state = {
        kind: 'rejected',
        memberId: latest.memberId,
        note: latest.note,
      };
    }
  }

  return (
    <div className="mx-auto max-w-md px-[22px] pb-6 pt-4 md:max-w-lg md:px-7 md:py-10">
      <PageHead
        en="Link your member profile"
        am="የአባልነት መለያዎን ያገናኙ"
        className="mb-3.5 md:mb-4"
      />
      <ClaimForm state={state} required={required === '1'} />
    </div>
  );
}
