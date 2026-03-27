import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { UsersTable } from './users-table';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Department = Database['public']['Tables']['departments']['Row'];

export default async function ManageUsersPage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .single();

  const profile = myProfile as Profile | null;

  if (profile?.role !== 'super_admin') {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card>
          <CardHeader className="text-center">
            <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
            <CardTitle className="mt-2">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              Only super admins can manage user roles.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [{ data: profiles }, { data: departments }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: true }),
    supabase.from('departments').select('*').order('id'),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <span className="text-secondary font-label text-[10px] tracking-widest uppercase block mb-1">የተጠቃሚ አስተዳደር</span>
      <h1 className="font-headline text-3xl text-primary">Manage Users</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Assign roles and departments to team members
      </p>
      <UsersTable
        profiles={(profiles as Profile[]) ?? []}
        departments={(departments as Department[]) ?? []}
      />
    </div>
  );
}
