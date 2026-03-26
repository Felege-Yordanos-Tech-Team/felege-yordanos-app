import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, CalendarCheck, Heart } from 'lucide-react';
import Link from 'next/link';

type Profile = Database['public']['Tables']['profiles']['Row'];

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
  const displayName = profile?.display_name || user?.email || 'User';

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">ሰላም, {displayName}!</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Welcome to Felege Yordanos Sunday School
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
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
