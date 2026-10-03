import { asc, desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowLeft, DoorOpen } from 'lucide-react';
import {
  attendance as attendanceTable,
  db,
  events as eventsTable,
  members as membersTable,
} from '@felege-yordanos/db/server';
import { canViewEventAttendance } from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import {
  CheckInTabs,
  type CheckInAttendance,
} from '../attendance/[eventId]/check-in-tabs';
import { CheckInEventPicker, type PickerEvent } from './check-in-event-picker';

type Event = typeof eventsTable.$inferSelect;

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

export default async function CheckInHubPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event: eventParam } = await searchParams;
  const user = await requireUser();

  const today = new Date().toISOString().split('T')[0];

  const [events, members] = await Promise.all([
    db.select().from(eventsTable).orderBy(desc(eventsTable.eventDate)),
    db
      .select({
        id: membersTable.id,
        memberId: membersTable.memberId,
        name: membersTable.name,
        fatherName: membersTable.fatherName,
      })
      .from(membersTable)
      .where(eq(membersTable.status, 'Active'))
      .orderBy(asc(membersTable.name)),
  ]);

  const todayEvents = events.filter((e) => e.eventDate === today);

  // Default selection: an explicit ?event wins; otherwise auto-pick today's
  // event when there's exactly one (zero-tap for the common door case).
  const validParam =
    eventParam && events.some((e) => e.id === eventParam) ? eventParam : null;
  const selectedId =
    validParam ?? (todayEvents.length === 1 ? todayEvents[0].id : null);
  const selectedEvent = selectedId
    ? (events.find((e) => e.id === selectedId) ?? null)
    : null;

  // Existing attendance is shown only when the user may read it.
  let attendance: CheckInAttendance[] = [];
  if (selectedEvent && canViewEventAttendance(user, selectedEvent)) {
    attendance = await db
      .select({
        memberId: attendanceTable.memberId,
        status: attendanceTable.status,
      })
      .from(attendanceTable)
      .where(eq(attendanceTable.eventId, selectedEvent.id));
  }

  const toPicker = (e: Event): PickerEvent => ({
    id: e.id,
    title: e.title,
    eventDate: e.eventDate,
    startTime: e.startTime,
  });

  const startTime = selectedEvent?.startTime?.slice(0, 5);
  const endTime = selectedEvent?.endTime?.slice(0, 5);
  const timeLabel =
    startTime && endTime
      ? `${startTime} – ${endTime}`
      : (startTime ?? endTime ?? null);

  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4 md:max-w-[1180px] md:px-8 md:pt-7">
      <Link
        href="/admin"
        className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep transition-colors hover:text-burgundy dark:text-gold dark:hover:text-gold-light md:hidden"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Admin panel
      </Link>

      <div className="md:flex md:items-end md:justify-between md:gap-6">
        <div>
          <div className="font-ethiopic text-xs font-medium tracking-[0.06em] text-gold-deep dark:text-gold">
            መግቢያ
          </div>
          <h1 className="mt-0.5 font-display text-[28px] font-medium leading-[1.05] text-burgundy-ink dark:text-cream md:text-[34px]">
            Check-in
          </h1>
          <p className="mt-1 text-xs text-muted-foreground md:text-sm">
            Pick an event, then scan or mark members present.
          </p>
        </div>

        <div className="mt-4 w-full md:mt-0 md:w-[340px]">
          <CheckInEventPicker
            events={events.map(toPicker)}
            selectedId={selectedId}
            todayEvents={todayEvents.map(toPicker)}
          />
        </div>
      </div>

      {/* Ornament rule (mobile) */}
      <div className="my-4 flex items-center gap-2.5 md:hidden">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-parchment-edge dark:to-ink-muted/40" />
        <span className="flex items-center gap-1">
          <span className="h-1 w-1 rounded-full bg-gold opacity-40" />
          <span className="h-1 w-1 rounded-full bg-gold" />
          <span className="h-1 w-1 rounded-full bg-gold opacity-40" />
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-parchment-edge dark:to-ink-muted/40" />
      </div>

      {selectedEvent ? (
        <div className="mt-5 md:mt-6">
          <div className="mb-3.5">
            <h2 className="font-display text-2xl font-medium leading-tight text-burgundy-ink dark:text-cream">
              {selectedEvent.title}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-burgundy/[0.08] px-2 py-0.5 font-mono text-[10px] font-medium text-burgundy dark:bg-gold/[0.12] dark:text-gold-light">
                {formatLongDate(selectedEvent.eventDate)}
              </span>
              {timeLabel && (
                <span className="rounded-md bg-gold/[0.16] px-2 py-0.5 font-mono text-[10px] font-medium text-gold-deep">
                  {timeLabel}
                </span>
              )}
            </div>
          </div>

          <CheckInTabs
            eventId={selectedEvent.id}
            members={members}
            attendance={attendance}
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-12 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/[0.14]">
            <DoorOpen className="h-5 w-5 text-gold-deep dark:text-gold" />
          </div>
          <p className="text-sm text-muted-foreground">
            Select an event above to start check-in.
          </p>
        </div>
      )}
    </div>
  );
}
