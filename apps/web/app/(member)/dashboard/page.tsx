import { cookies } from 'next/headers';
import { createServerComponentClient, getLinkedMember } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Music, CalendarCheck, Heart, Link2 } from 'lucide-react';
import Link from 'next/link';
import { EventFeed } from './event-feed';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Event = Database['public']['Tables']['events']['Row'];
type Department = Database['public']['Tables']['departments']['Row'];

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
    .limit(10);

  const { data: pastData } = await supabase
    .from('events')
    .select('*')
    .lt('event_date', today)
    .order('event_date', { ascending: false })
    .limit(5);

  const { data: departmentsData } = await supabase
    .from('departments')
    .select('*')
    .order('id');

  const upcoming = (upcomingData ?? []) as Event[];
  const past = (pastData ?? []) as Event[];
  const departments = (departmentsData ?? []) as Department[];

  const greetingName = member
    ? [member.name, member.father_name].filter(Boolean).join(' ')
    : profile?.display_name || user?.email || 'User';

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      {/* Hero Banner */}
      <section className="mb-8 relative">
        <div className="h-32 w-full rounded-xl bg-primary-container relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 tibeb-pattern" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-transparent opacity-60" />
          <div className="relative z-10 text-center px-4">
            <p className="text-[#fed65b] font-label text-[10px] tracking-widest uppercase mb-1">እንኳን ደህና መጡ</p>
            <h2 className="font-headline text-3xl text-[#fef9ea] leading-tight">
              Welcome, {greetingName.split(' ')[0]}
            </h2>
            {member && (
              <Badge className="mt-2 bg-[#735c00]/20 text-[#fed65b] text-xs">
                {member.member_id}
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Claim Prompt */}
      {!member && (
        <section className="mb-8">
          <Card className="bg-surface-container-low">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="bg-secondary/10 p-3 rounded-full">
                <Link2 className="h-5 w-5 text-secondary" />
              </div>
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
        </section>
      )}

      {/* Bento Quick Actions */}
      <section className="mb-8">
        <div className="grid grid-cols-2 gap-4">
          {/* Songbook — spans 2 cols */}
          <Link href="/songbook" className="col-span-2">
            <div className="p-6 rounded-xl bg-surface-container-high relative overflow-hidden transition-all hover:-translate-y-0.5">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-secondary/10 p-3 rounded-full">
                  <Music className="h-5 w-5 text-secondary" />
                </div>
                <span className="text-secondary/20 font-headline text-4xl">መዝሙር</span>
              </div>
              <h3 className="font-headline text-2xl">Songbook</h3>
              <p className="text-muted-foreground text-sm mt-1">Lyrics and recordings for lessons</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Open Library →
              </span>
            </div>
          </Link>

          {/* Attendance */}
          <Link href="/attendance">
            <div className="p-5 rounded-xl bg-surface-container-low flex flex-col justify-between aspect-square transition-all hover:-translate-y-0.5">
              <CalendarCheck className="h-5 w-5 text-primary mb-4" />
              <div>
                <h4 className="font-headline text-xl leading-none mb-1">Attendance</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-label">አገልግሎት መግቢያ</p>
              </div>
            </div>
          </Link>

          {/* Donate */}
          <Link href="/donate">
            <div className="p-5 rounded-xl bg-surface-container-low flex flex-col justify-between aspect-square transition-all hover:-translate-y-0.5">
              <Heart className="h-5 w-5 text-primary mb-4" />
              <div>
                <h4 className="font-headline text-xl leading-none mb-1">Donate</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-label">ስጦታ</p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Events Feed */}
      <EventFeed
        upcoming={upcoming}
        past={past}
        departments={departments}
      />
    </div>
  );
}
