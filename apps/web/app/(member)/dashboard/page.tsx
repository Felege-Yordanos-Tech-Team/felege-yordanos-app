import { cookies } from 'next/headers';
import { createServerComponentClient, getLinkedMember } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { BadgeCheck, Music, CalendarCheck, Heart, Link2, ArrowRight } from 'lucide-react';
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

  const today = new Date().toISOString().split('T')[0];

  const [
    { data },
    member,
    { data: upcomingData },
    { data: pastData },
    { data: departmentsData },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user?.id ?? '').single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getLinkedMember(supabase as any, user?.id ?? ''),
    supabase.from('events').select('*').gte('event_date', today).order('event_date', { ascending: true }).limit(10),
    supabase.from('events').select('*').lt('event_date', today).order('event_date', { ascending: false }).limit(5),
    supabase.from('departments').select('*').order('id'),
  ]);

  const profile = data as Profile | null;
  const upcoming = (upcomingData ?? []) as Event[];
  const past = (pastData ?? []) as Event[];
  const departments = (departmentsData ?? []) as Department[];

  const fullName = member
    ? [member.name, member.father_name].filter(Boolean).join(' ')
    : profile?.display_name || user?.email || 'User';
  const firstName = fullName.split(' ')[0];

  const memberDeptName = profile?.department_id
    ? departments.find((d) => d.id === profile.department_id)?.name_am ?? null
    : null;

  return (
    <div className="mx-auto max-w-2xl px-[18px] pb-6 pt-[14px]">
      {/* Hero greeting card */}
      <section className="sacred-gradient relative overflow-hidden rounded-[20px] px-5 py-5 text-cream shadow-fy-lg">
        <div className="tibeb-gold absolute inset-0 opacity-50" />
        <div
          className="absolute -right-8 -top-8 h-40 w-40"
          style={{
            background:
              'radial-gradient(circle, rgba(212,168,67,0.32) 0%, transparent 60%)',
            filter: 'blur(8px)',
          }}
        />
        <div className="relative">
          <div className="mb-1 font-ethiopic text-xs tracking-wider text-gold-light">
            እንኳን ደህና መጡ
          </div>
          <h1 className="font-display text-[32px] font-medium leading-tight text-cream">
            Welcome, <em className="text-gold">{firstName}</em>
          </h1>
          {member && (
            <div className="mt-2.5 inline-flex w-fit items-center gap-1.5 rounded-full border border-gold/35 bg-gold/[0.18] px-2.5 py-1">
              <BadgeCheck className="h-3 w-3 text-gold" strokeWidth={2.25} />
              <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-gold">
                {member.member_id}
              </span>
              {memberDeptName && (
                <>
                  <span className="font-ethiopic text-[10px] text-gold-light/65">
                    · {memberDeptName}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Claim prompt */}
      {!member && (
        <section className="mt-4">
          <div className="gold-accent-l rounded-2xl border border-border bg-card px-4 py-3 pl-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-burgundy/10 p-2.5 dark:bg-gold/10">
                <Link2 className="h-4 w-4 text-burgundy dark:text-gold" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Link your member profile
                </p>
                <p className="text-xs text-muted-foreground">
                  Required for attendance and donation history
                </p>
              </div>
              <Link
                href="/claim"
                className="rounded-lg bg-burgundy px-3 py-1.5 text-xs font-semibold text-cream hover:bg-burgundy-soft dark:bg-gold dark:text-burgundy-ink dark:hover:bg-gold-light"
              >
                Link
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section className="mt-[22px]">
        <div className="mb-2.5">
          <div className="font-ethiopic text-[11px] font-medium tracking-[0.08em] text-gold-deep dark:text-gold">
            ፈጣን መዳረሻዎች
          </div>
          <h2 className="font-display text-[22px] font-medium leading-[1.05] tracking-tight text-burgundy-ink dark:text-cream">
            Quick actions
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Songbook — full width feature tile */}
          <Link
            href="/songbook"
            className="relative col-span-2 flex items-center gap-3.5 overflow-hidden rounded-2xl border border-border bg-card px-4 py-4 shadow-fy-md transition-all hover:-translate-y-0.5"
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-fy-gold"
              style={{ background: 'linear-gradient(135deg, #D4A843, #A47A18)' }}
            >
              <Music className="h-5 w-5 text-cream" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <h3 className="font-display text-xl font-medium leading-none text-burgundy-ink dark:text-cream">
                  Songbook
                </h3>
                <span className="font-ethiopic text-[13px] text-gold-deep dark:text-gold">
                  · መዝሙር
                </span>
              </div>
              <p className="mt-1 text-[11.5px] text-muted-foreground">
                Lyrics & recordings
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-gold-deep dark:text-gold" />
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-2 -right-2 font-ethiopic text-[60px] leading-none text-gold/[0.06]"
            >
              ✣
            </span>
          </Link>

          {/* Attendance */}
          <Link
            href="/attendance"
            className="flex aspect-square flex-col justify-between rounded-2xl border border-border bg-card p-3.5 transition-all hover:-translate-y-0.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-burgundy/[0.08] dark:bg-gold/[0.12]">
              <CalendarCheck className="h-[18px] w-[18px] text-burgundy dark:text-gold" strokeWidth={1.75} />
            </div>
            <div>
              <h4 className="mb-1 font-display text-[19px] font-medium leading-none text-burgundy-ink dark:text-cream">
                Attendance
              </h4>
              <p className="font-ethiopic text-[11px] tracking-wider text-gold-deep dark:text-gold">
                ክትትል
              </p>
            </div>
          </Link>

          {/* Donate */}
          <Link
            href="/donate"
            className="flex aspect-square flex-col justify-between rounded-2xl border border-border bg-card p-3.5 transition-all hover:-translate-y-0.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-burgundy/[0.08] dark:bg-gold/[0.12]">
              <Heart className="h-[18px] w-[18px] text-burgundy dark:text-gold" strokeWidth={1.75} />
            </div>
            <div>
              <h4 className="mb-1 font-display text-[19px] font-medium leading-none text-burgundy-ink dark:text-cream">
                Donate
              </h4>
              <p className="font-ethiopic text-[11px] tracking-wider text-gold-deep dark:text-gold">
                ስጦታ
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Events feed */}
      <EventFeed upcoming={upcoming} past={past} departments={departments} />
    </div>
  );
}
