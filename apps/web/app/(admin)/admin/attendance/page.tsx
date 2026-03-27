import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { EventsList } from './events-list';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Department = Database['public']['Tables']['departments']['Row'];

export default async function ManageAttendancePage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .single();

  const profile = profileData as Profile | null;

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false });

  const { data: departments } = await supabase
    .from('departments')
    .select('*')
    .order('id');

  // Get attendance counts per event
  const { data: attendanceCounts } = await supabase
    .from('attendance')
    .select('event_id, status');

  const countMap: Record<string, number> = {};
  if (attendanceCounts) {
    for (const a of attendanceCounts as { event_id: string; status: string }[]) {
      if (a.status === 'present' || a.status === 'late') {
        countMap[a.event_id] = (countMap[a.event_id] ?? 0) + 1;
      }
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <span className="text-secondary font-label text-[10px] tracking-widest uppercase block mb-1">የስብሰባ ክትትል</span>
      <h1 className="font-headline text-3xl text-primary">Events & Attendance</h1>
      <p className="mt-1 text-sm text-muted-foreground">
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
