import { asc, eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { attendance, db, events, members } from '@felege-yordanos/db/server';
import { checkInWindow } from '@/lib/check-in-window';
import {
  canViewEventAttendance,
  isLimitedToCheckInWindow,
} from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import { CheckInTabs } from './check-in-tabs';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CheckInPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const user = await requireUser();
  if (!UUID_RE.test(eventId)) notFound();

  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!event) notFound();
  if (!canViewEventAttendance(user, event)) redirect('/dashboard');

  const [memberRows, attendanceRows] = await Promise.all([
    db
      .select({
        id: members.id,
        memberId: members.memberId,
        name: members.name,
        fatherName: members.fatherName,
      })
      .from(members)
      .where(eq(members.status, 'Active'))
      .orderBy(asc(members.name)),
    db
      .select({ memberId: attendance.memberId, status: attendance.status })
      .from(attendance)
      .where(eq(attendance.eventId, event.id)),
  ]);

  const times = checkInWindow(event);

  return (
    <CheckInTabs
      eventId={event.id}
      checkIn={{
        opensAt: times.opensAt.toISOString(),
        closesAt: times.closesAt.toISOString(),
        now: Date.now(),
        limited: isLimitedToCheckInWindow(user),
      }}
      members={memberRows}
      attendance={attendanceRows}
      event={{
        title: event.title,
        eventDate: event.eventDate,
        startTime: event.startTime,
        endTime: event.endTime,
        description: event.description,
      }}
      back={{ href: '/admin/attendance', label: 'Events' }}
    />
  );
}
