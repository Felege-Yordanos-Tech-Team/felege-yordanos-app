import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
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
      <div className="mx-auto max-w-md px-[22px] py-16">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h2 className="mt-2 font-display text-2xl font-medium text-burgundy-ink dark:text-cream">
            Access denied
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Only super admins can manage user roles.
          </p>
        </div>
      </div>
    );
  }

  const [{ data: profiles }, { data: departments }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: true }),
    supabase.from('departments').select('*').order('id'),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4">
      <Link
        href="/admin"
        className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep transition-colors hover:text-burgundy dark:text-gold dark:hover:text-gold-light"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Admin panel
      </Link>

      <div className="font-ethiopic text-xs font-medium tracking-[0.06em] text-gold-deep dark:text-gold">
        የተጠቃሚ አስተዳደር
      </div>
      <h1 className="mt-0.5 font-display text-[28px] font-medium leading-[1.05] text-burgundy-ink dark:text-cream">
        Manage users
      </h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Assign roles and departments · super admin only
      </p>

      <UsersTable
        profiles={(profiles as Profile[]) ?? []}
        departments={(departments as Department[]) ?? []}
      />
    </div>
  );
}
