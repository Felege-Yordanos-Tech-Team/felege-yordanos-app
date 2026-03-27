import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckInTabs } from './check-in-tabs';

type Event = Database['public']['Tables']['events']['Row'];
type Member = Database['public']['Tables']['members']['Row'];
type Attendance = Database['public']['Tables']['attendance']['Row'];

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

  const { data: eventData } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  const event = eventData as Event | null;
  if (!event) notFound();

  const { data: members } = await supabase
    .from('members')
    .select('*')
    .eq('status', 'Active')
    .order('name');

  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('event_id', eventId);

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/admin/attendance">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to events
        </Link>
      </Button>

      <div>
        <h1 className="font-headline text-2xl text-primary">{event.title}</h1>
        {event.description && (
          <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="outline">{event.event_date}</Badge>
          {(event.start_time || event.end_time) && (
            <Badge variant="secondary">
              {event.start_time?.slice(0, 5)}
              {event.start_time && event.end_time && ' – '}
              {event.end_time?.slice(0, 5)}
            </Badge>
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
