import { asc, desc, eq, gte } from 'drizzle-orm';
import {
  attendance,
  db,
  departments,
  events,
  members,
} from '@felege-yordanos/db/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link2 } from 'lucide-react';
import Link from 'next/link';
import { formatShortDate } from '@/lib/format';
import { requireUser } from '@/lib/session';
import {
  AttendanceDesktopView,
  type AttnRow,
  type AttnStatus,
} from './attendance-desktop';

const statusBadge: Record<
  string,
  {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
  }
> = {
  present: { variant: 'default', className: 'bg-green-600' },
  absent: { variant: 'destructive', className: '' },
  late: { variant: 'default', className: 'bg-yellow-600' },
};

export default async function MyAttendancePage() {
  const user = await requireUser();

  // The member record linked to this login (through the /claim flow).
  const [member] = await db
    .select({ id: members.id, memberId: members.memberId })
    .from(members)
    .where(eq(members.authUserId, user.id))
    .limit(1);

  if (!member) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <Link2 className="h-8 w-8 text-muted-foreground" />
            <p className="text-center text-sm text-muted-foreground">
              Link your member profile to see your attendance history
            </p>
            <Button asChild>
              <Link href="/claim">Link Member Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  const [attendanceRecords, departmentRows, upcomingData] = await Promise.all([
    // Only the signed-in user's own records.
    db
      .select({
        id: attendance.id,
        status: attendance.status,
        events: events,
      })
      .from(attendance)
      .innerJoin(events, eq(events.id, attendance.eventId))
      .where(eq(attendance.memberId, member.id))
      .orderBy(desc(attendance.createdAt)),
    db.select().from(departments).orderBy(asc(departments.id)),
    db
      .select()
      .from(events)
      .where(gte(events.eventDate, today))
      .orderBy(asc(events.eventDate))
      .limit(1),
  ]);

  const deptName = (id: number | null) =>
    id ? (departmentRows.find((d) => d.id === id)?.nameAm ?? 'ጠቅላላ') : 'ጠቅላላ';

  // Desktop table rows (real attendance records, most-recent first).
  const rows: AttnRow[] = attendanceRecords.map((r) => ({
    title: r.events?.title ?? 'Event',
    deptAm: deptName(r.events?.departmentId ?? null),
    date: r.events?.eventDate ?? '',
    dateLabel: r.events?.eventDate ? formatShortDate(r.events.eventDate) : '—',
    time: r.events?.startTime ? r.events.startTime.slice(0, 5) : '',
    status: (r.status as AttnStatus) ?? 'absent',
  }));

  const nextEventRow = upcomingData[0];
  const nextEvent = nextEventRow
    ? {
        title: nextEventRow.title,
        dateLabel: formatShortDate(nextEventRow.eventDate),
        time: nextEventRow.startTime ? nextEventRow.startTime.slice(0, 5) : '',
      }
    : null;

  return (
    <>
      {/* ─── MOBILE (< md) — simple list ─── */}
      <div className="mx-auto max-w-2xl px-6 py-6 md:hidden">
        <span className="text-secondary font-label text-[10px] tracking-widest uppercase block mb-1">
          አገልግሎት መግቢያ
        </span>
        <h1 className="font-headline text-3xl text-primary">My Attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your attendance history across events
        </p>

        {attendanceRecords.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            No attendance records yet.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {attendanceRecords.map((record) => {
              const badge = statusBadge[record.status] ?? statusBadge.absent;
              return (
                <Card key={record.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">
                        {record.events?.title ?? 'Event'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {record.events?.eventDate}
                      </p>
                    </div>
                    <Badge variant={badge.variant} className={badge.className}>
                      {record.status}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── DESKTOP (md+) — table/calendar + next-event/QR ─── */}
      <AttendanceDesktopView
        className="hidden px-7 py-7 md:block"
        rows={rows}
        nextEvent={nextEvent}
        memberId={member.memberId}
      />
    </>
  );
}
