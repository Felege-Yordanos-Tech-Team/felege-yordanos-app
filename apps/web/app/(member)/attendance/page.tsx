import { cookies } from 'next/headers';
import { createServerComponentClient, getLinkedMember } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link2 } from 'lucide-react';
import Link from 'next/link';

type Event = Database['public']['Tables']['events']['Row'];

const statusBadge: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  present: { variant: 'default', className: 'bg-green-600' },
  absent: { variant: 'destructive', className: '' },
  late: { variant: 'default', className: 'bg-yellow-600' },
};

export default async function MyAttendancePage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const member = await getLinkedMember(supabase as any, user?.id ?? '');

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

  const { data: records } = await supabase
    .from('attendance')
    .select('*, events(*)')
    .eq('member_id', member.id)
    .order('created_at', { ascending: false });

  const attendanceRecords = (records ?? []) as (Database['public']['Tables']['attendance']['Row'] & {
    events: Event;
  })[];

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <span className="text-secondary font-label text-[10px] tracking-widest uppercase block mb-1">አገልግሎት መግቢያ</span>
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
                    <p className="font-medium">{record.events?.title ?? 'Event'}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.events?.event_date}
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
  );
}
