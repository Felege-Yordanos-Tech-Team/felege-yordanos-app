import { cookies } from 'next/headers';
import { createServerComponentClient, getLinkedMember } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Music, CalendarCheck, Heart, Link2, Clock } from 'lucide-react';
import Link from 'next/link';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Event = Database['public']['Tables']['events']['Row'];

const quickActions = [
  {
    href: '/songbook',
    icon: Music,
    title: 'Songbook',
    description: 'Browse and search songs',
  },
  {
    href: '/attendance',
    icon: CalendarCheck,
    title: 'Attendance',
    description: 'View your history',
  },
  {
    href: '/donate',
    icon: Heart,
    title: 'Donate',
    description: 'Make a donation',
  },
];

export default async function MemberDashboard() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .single();

  const profile = data as Profile | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const member = await getLinkedMember(supabase as any, user?.id ?? '');

  const today = new Date().toISOString().split('T')[0];

  const { data: upcomingData } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(5);

  const { data: pastData } = await supabase
    .from('events')
    .select('*')
    .lt('event_date', today)
    .order('event_date', { ascending: false })
    .limit(3);

  const upcoming = (upcomingData ?? []) as Event[];
  const past = (pastData ?? []) as Event[];

  const greetingName = member
    ? [member.name, member.father_name].filter(Boolean).join(' ')
    : profile?.display_name || user?.email || 'User';

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">ሰላም, {greetingName}!</h1>
          {member && (
            <Badge variant="outline" className="mt-1">
              {member.member_id}
            </Badge>
          )}
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Welcome to Felege Yordanos Sunday School
      </p>

      {!member && (
        <Card className="mt-4 border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-4">
            <Link2 className="h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                You haven&apos;t linked your member profile yet
              </p>
              <p className="text-xs text-muted-foreground">
                Link to access attendance and other features
              </p>
            </div>
            <Button size="sm" asChild>
              <Link href="/claim">Link Now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      {upcoming.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Upcoming Events</h2>
          <div className="mt-2 space-y-2">
            {upcoming.map((event) => (
              <Card key={event.id}>
                <CardContent className="flex items-center gap-4 py-3">
                  <CalendarCheck className="h-5 w-5 shrink-0 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{event.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{event.event_date}</span>
                      {event.start_time && (
                        <>
                          <Clock className="h-3 w-3" />
                          <span>{event.start_time.slice(0, 5)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant="default" className="shrink-0 bg-green-600">
                    Upcoming
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Events */}
      {past.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Recent Events</h2>
          <div className="mt-2 space-y-2">
            {past.map((event) => (
              <Card key={event.id} className="opacity-75">
                <CardContent className="flex items-center gap-4 py-3">
                  <CalendarCheck className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.event_date}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    Past
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Separator className="my-6" />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-base">{action.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
