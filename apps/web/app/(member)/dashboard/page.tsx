import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarCheck, Heart } from 'lucide-react';
import Link from 'next/link';

export default async function MemberDashboard() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Welcome!</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Signed in as {user?.email}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <Link href="/attendance">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="pb-2">
              <CalendarCheck className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-base">Attendance</CardTitle>
              <p className="text-sm text-muted-foreground">View history</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/donate">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="pb-2">
              <Heart className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-base">Donate</CardTitle>
              <p className="text-sm text-muted-foreground">Make a donation</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
