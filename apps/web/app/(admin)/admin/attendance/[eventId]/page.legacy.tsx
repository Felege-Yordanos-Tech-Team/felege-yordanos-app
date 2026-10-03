import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CheckInTabs } from './check-in-tabs';

type Event = Database['public']['Tables']['events']['Row'];
type Member = Database['public']['Tables']['members']['Row'];
type Attendance = Database['public']['Tables']['attendance']['Row'];

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
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: eventData }, { data: members }, { data: attendance }] = await Promise.all([
    supabase.from('events').select('*').eq('id', eventId).single(),
    supabase.from('members').select('*').eq('status', 'Active').order('name'),
    supabase.from('attendance').select('*').eq('event_id', eventId),
  ]);

  const event = eventData as Event | null;
  if (!event) notFound();

  const startTime = event.start_time?.slice(0, 5);
  const endTime = event.end_time?.slice(0, 5);
  const timeLabel =
    startTime && endTime
      ? `${startTime} – ${endTime}`
      : startTime ?? endTime ?? null;

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
            {formatLongDate(event.event_date)}
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
        eventId={eventId}
        members={(members as Member[]) ?? []}
        attendance={(attendance as Attendance[]) ?? []}
        userId={user?.id ?? ''}
      />
    </div>
  );
}
