import { asc, eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { attendance, db, events, members } from '@felege-yordanos/db/server';
import { canViewEventAttendance } from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import { CheckInTabs } from './check-in-tabs';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatLongDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return d;
  }
}

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

  const startTime = event.startTime?.slice(0, 5);
  const endTime = event.endTime?.slice(0, 5);
  const timeLabel =
    startTime && endTime
      ? `${startTime} – ${endTime}`
      : (startTime ?? endTime ?? null);

  return (
    <div className="mx-auto max-w-2xl px-[18px] pb-6 pt-3">
      <Link
        href="/admin/attendance"
        className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep transition-colors hover:text-burgundy dark:text-gold dark:hover:text-gold-light"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Events
      </Link>

      <div className="mb-3.5">
        <div className="font-ethiopic text-[11px] font-medium tracking-[0.06em] text-gold-deep dark:text-gold">
          የስብሰባ ክትትል
        </div>
        <h1 className="mt-0.5 font-display text-2xl font-medium leading-tight text-burgundy-ink dark:text-cream">
          {event.title}
        </h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-md bg-burgundy/[0.08] px-2 py-0.5 font-mono text-[10px] font-medium text-burgundy dark:bg-gold/[0.12] dark:text-gold-light">
            {formatLongDate(event.eventDate)}
          </span>
          {timeLabel && (
            <span className="rounded-md bg-gold/[0.16] px-2 py-0.5 font-mono text-[10px] font-medium text-gold-deep">
              {timeLabel}
            </span>
          )}
          {event.description && (
            <span className="text-[11px] italic text-muted-foreground">
              · {event.description}
            </span>
          )}
        </div>
      </div>

      <CheckInTabs
        eventId={event.id}
        members={memberRows}
        attendance={attendanceRows}
      />
    </div>
  );
}
