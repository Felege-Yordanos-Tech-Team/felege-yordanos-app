import { and, asc, desc, eq, gte, lt, sum } from 'drizzle-orm';
import {
  db,
  departments as departmentsTable,
  donations,
  events,
  members,
  songs as songsTable,
} from '@felege-yordanos/db/server';
import { Card } from '@/components/ds';
import { getLocale } from '@/lib/i18n/server';
import { requireUser } from '@/lib/session';
import { EventFeed } from './event-feed';
import { WelcomeBanner } from './cards/welcome-banner';
import { MyGivingCard } from './cards/my-giving-card';
import { SongbookPreviewCard } from './cards/continue-singing-card';
import { CheckInCard } from './cards/check-in-card';
import { LinkProfilePrompt } from './cards/link-profile-prompt';
import { QuickActions } from './cards/quick-actions';

/** Columns the event feed and welcome banner need. */
const eventColumns = {
  id: events.id,
  title: events.title,
  description: events.description,
  eventDate: events.eventDate,
  startTime: events.startTime,
  endTime: events.endTime,
  departmentId: events.departmentId,
};

export default async function MemberDashboard() {
  const [user, locale] = await Promise.all([requireUser(), getLocale()]);

  // Same day boundary as before: the UTC date.
  const today = new Date().toISOString().split('T')[0];

  // My-giving summary (desktop card): verified total this year + latest verified.
  // Year boundaries in server-local time, as the old JS filter did.
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const startOfNextYear = new Date(currentYear + 1, 0, 1);

  // A member only ever sees their own donations (donor_id = current user).
  const ownDonation = eq(donations.donorId, user.id);
  const ownVerified = and(ownDonation, eq(donations.status, 'verified'));

  const [
    [member],
    upcoming,
    past,
    departments,
    [verifiedTotal],
    [lastVerified],
    [latestDonation],
    previewSongs,
    songCount,
  ] = await Promise.all([
    db
      .select({
        memberId: members.memberId,
        name: members.name,
        fatherName: members.fatherName,
      })
      .from(members)
      .where(eq(members.authUserId, user.id))
      .limit(1),
    db
      .select(eventColumns)
      .from(events)
      .where(gte(events.eventDate, today))
      .orderBy(asc(events.eventDate))
      .limit(10),
    db
      .select(eventColumns)
      .from(events)
      .where(lt(events.eventDate, today))
      .orderBy(desc(events.eventDate))
      .limit(5),
    db
      .select({
        id: departmentsTable.id,
        nameAm: departmentsTable.nameAm,
        nameEn: departmentsTable.nameEn,
      })
      .from(departmentsTable)
      .orderBy(asc(departmentsTable.id)),
    db
      .select({ total: sum(donations.amount) })
      .from(donations)
      .where(
        and(
          ownVerified,
          gte(donations.createdAt, startOfYear),
          lt(donations.createdAt, startOfNextYear),
        ),
      ),
    db
      .select({
        amount: donations.amount,
        currency: donations.currency,
        paymentMethod: donations.paymentMethod,
        status: donations.status,
        createdAt: donations.createdAt,
      })
      .from(donations)
      .where(ownVerified)
      .orderBy(desc(donations.createdAt))
      .limit(1),
    db
      .select({ currency: donations.currency })
      .from(donations)
      .where(ownDonation)
      .orderBy(desc(donations.createdAt))
      .limit(1),
    // Songbook preview: play history isn't tracked, so show the first songs by number.
    db
      .select({
        id: songsTable.id,
        number: songsTable.number,
        title: songsTable.title,
        titleEn: songsTable.titleEn,
        audioUrl: songsTable.audioUrl,
      })
      .from(songsTable)
      .orderBy(asc(songsTable.number))
      .limit(3),
    db.$count(songsTable),
  ]);

  const verifiedThisYear = Number(verifiedTotal?.total ?? 0);
  const givingCurrency = latestDonation?.currency ?? 'ETB';
  const nextEvent = upcoming[0] ?? null;

  const fullName = member
    ? [member.name, member.fatherName].filter(Boolean).join(' ')
    : user.displayName || user.email || 'User';
  const firstName = fullName.split(' ')[0];

  // Department names in the current language.
  const depts = departments.map((d) => ({
    id: d.id,
    name: locale === 'en' ? d.nameEn : d.nameAm,
  }));
  const memberDeptName = user.departmentId
    ? (depts.find((d) => d.id === user.departmentId)?.name ?? null)
    : null;

  const hero = {
    firstName,
    memberId: member?.memberId ?? null,
    memberDeptName,
    nextEvent,
  };

  return (
    <>
      {/* ─── PHONE (< md): hero, quick actions, event cards ─── */}
      <div className="mx-auto max-w-2xl px-[18px] pb-6 pt-[14px] md:hidden">
        <WelcomeBanner {...hero} variant="mobile" />
        {!member && <LinkProfilePrompt className="mt-3.5" />}
        <QuickActions songCount={songCount} />
        <EventFeed
          upcoming={upcoming}
          past={past}
          departments={depts}
          variant="mobile"
        />
      </div>

      {/* ─── DESKTOP (md+): hero band + two-column grid ─── */}
      <div className="hidden p-7 md:block">
        <WelcomeBanner {...hero} variant="desktop" />
        {!member && <LinkProfilePrompt className="mt-4" />}

        <div className="mt-4 grid grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] items-start gap-4">
          <Card>
            <EventFeed
              upcoming={upcoming}
              past={past}
              departments={depts}
              variant="desktop"
            />
          </Card>

          <div className="flex flex-col gap-4">
            <SongbookPreviewCard songs={previewSongs} />
            <MyGivingCard
              total={verifiedThisYear}
              currency={givingCurrency}
              last={
                lastVerified
                  ? { ...lastVerified, amount: Number(lastVerified.amount) }
                  : null
              }
            />
            {member && <CheckInCard memberId={member.memberId} />}
          </div>
        </div>
      </div>
    </>
  );
}
