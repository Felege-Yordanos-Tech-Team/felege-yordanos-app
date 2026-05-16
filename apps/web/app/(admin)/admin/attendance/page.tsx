import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { EventsList } from './events-list';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Department = Database['public']['Tables']['departments']['Row'];

export default async function ManageAttendancePage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: profileData },
    { data: events },
    { data: departments },
    { data: attendanceCounts },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user?.id ?? '').single(),
    supabase.from('events').select('*').order('event_date', { ascending: false }),
    supabase.from('departments').select('*').order('id'),
    supabase.from('attendance').select('event_id, status'),
  ]);

  const profile = profileData as Profile | null;

  const countMap: Record<string, number> = {};
  if (attendanceCounts) {
    for (const a of attendanceCounts as { event_id: string; status: string }[]) {
      if (a.status === 'present' || a.status === 'late') {
        countMap[a.event_id] = (countMap[a.event_id] ?? 0) + 1;
      }
    }
  }

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
        የስብሰባ ክትትል
      </div>
      <h1 className="mt-0.5 font-display text-[28px] font-medium leading-[1.05] text-burgundy-ink dark:text-cream">
        Events &amp; attendance
      </h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Create events and manage attendance records
      </p>

      <EventsList
        events={(events as Database['public']['Tables']['events']['Row'][]) ?? []}
        departments={(departments as Department[]) ?? []}
        attendanceCounts={countMap}
        userRole={profile?.role ?? 'member'}
        userDeptId={profile?.department_id ? Number(profile.department_id) : null}
        userId={user?.id ?? ''}
      />
    </div>
  );
}
