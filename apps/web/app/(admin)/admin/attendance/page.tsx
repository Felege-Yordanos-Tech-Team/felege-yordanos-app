import { asc, count, desc } from 'drizzle-orm';
import {
  attendance,
  db,
  departments,
  events,
} from '@felege-yordanos/db/server';
import { canEditEvent, canViewEventAttendance } from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import { EventsList } from './events-list';

export default async function ManageAttendancePage() {
  const user = await requireUser();

  const [eventRows, departmentRows, attendanceRows] = await Promise.all([
    db.select().from(events).orderBy(desc(events.eventDate)),
    db.select().from(departments).orderBy(asc(departments.id)),
    db
      .select({
        eventId: attendance.eventId,
        status: attendance.status,
        n: count(),
      })
      .from(attendance)
      .groupBy(attendance.eventId, attendance.status),
  ]);

  // Attendance counts only for events whose attendance this user may read
  // (canViewEventAttendance). The "has attendance" flag, which freezes an
  // occurrence against delete/series changes, is also given for events the
  // user may edit, so the edit dialog shows it.
  const byId = new Map(eventRows.map((e) => [e.id, e]));
  const countMap: Record<string, number> = {};
  const attendedIds = new Set<string>();
  for (const a of attendanceRows) {
    const event = byId.get(a.eventId);
    if (!event) continue;
    const canView = canViewEventAttendance(user, event);
    if (canView || canEditEvent(user, event)) attendedIds.add(a.eventId);
    if (canView && (a.status === 'present' || a.status === 'late')) {
      countMap[a.eventId] = (countMap[a.eventId] ?? 0) + a.n;
    }
  }

  return (
    <EventsList
      events={eventRows}
      departments={departmentRows}
      attendanceCounts={countMap}
      attendedIds={[...attendedIds]}
      userRole={user.role}
      userDeptId={user.departmentId}
    />
  );
}
