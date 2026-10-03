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

  // Per-event present/late counts + the set of events that have ANY attendance
  // (the latter freezes those occurrences against series delete/regeneration).
  const countMap: Record<string, number> = {};
  const attendedIds = new Set<string>();
  if (attendanceCounts) {
    for (const a of attendanceCounts as { event_id: string; status: string }[]) {
      attendedIds.add(a.event_id);
      if (a.status === 'present' || a.status === 'late') {
        countMap[a.event_id] = (countMap[a.event_id] ?? 0) + 1;
      }
    }
  }

  return (
    <EventsList
      events={(events as Database['public']['Tables']['events']['Row'][]) ?? []}
      departments={(departments as Department[]) ?? []}
      attendanceCounts={countMap}
      attendedIds={[...attendedIds]}
      userRole={profile?.role ?? 'member'}
      userDeptId={profile?.department_id ? Number(profile.department_id) : null}
      userId={user?.id ?? ''}
    />
  );
}
