import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import {
  ArrowRight,
  CalendarCheck,
  Music,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AdminLinkDef {
  href: string;
  icon: typeof CalendarCheck;
  am: string;
  en: string;
  description: string;
  cta: string;
  featured?: boolean;
  songsOnly: boolean;
  showBadge?: boolean;
}

const adminLinks: AdminLinkDef[] = [
  {
    href: '/admin/attendance',
    icon: CalendarCheck,
    am: 'የስብሰባ ክትትል',
    en: 'Events & Attendance',
    description:
      'Coordinate liturgical gatherings, choir rehearsals, and track member participation.',
    cta: 'Manage schedules',
    songsOnly: false,
  },
  {
    href: '/admin/songs',
    icon: Music,
    am: 'መዝሙር አስተዳደር',
    en: 'Songs & Categories',
    description:
      'Add, edit, and organize hymns for the Sunday School songbook.',
    cta: 'Manage songs',
    featured: true,
    songsOnly: true,
  },
  {
    href: '/admin/donations',
    icon: Wallet,
    am: 'ስጦታዎች',
    en: 'Donations',
    description:
      'Verify tithes, special contributions, and charitable funds.',
    cta: 'Verification queue',
    songsOnly: false,
    showBadge: true,
  },
  {
    href: '/admin/users',
    icon: Users,
    am: 'የተጠቃሚ አስተዳደር',
    en: 'Manage Users',
    description:
      'Assign roles, manage departments, oversee membership.',
    cta: 'View members',
    songsOnly: false,
  },
];

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().split('T')[0];
  const startOfTodayIso = `${today}T00:00:00.000Z`;

  const [
    { data: profileData },
    { count: todayCheckIns },
    { count: pendingDonations },
    { count: membersTotal },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user?.id ?? '').single(),
    supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .in('status', ['present', 'late'])
      .gte('created_at', startOfTodayIso),
    supabase
      .from('donations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ]);

  const profile = profileData as Profile | null;
  const isSongsDeptHead =
    profile?.role === 'dept_head' && profile?.department_id === 6;
  const isFullAdmin =
    profile?.role === 'admin' || profile?.role === 'super_admin';

  const visibleLinks = adminLinks.filter((link) => {
    if (isFullAdmin) return true;
    if (isSongsDeptHead) return link.songsOnly;
    return !link.songsOnly;
  });

  const stats = [
    { am: 'ዛሬ', en: 'Today', value: todayCheckIns ?? 0, sub: 'check-ins' },
    { am: 'በመጠባበቅ', en: 'Pending', value: pendingDonations ?? 0, sub: 'donations' },
    { am: 'አባላት', en: 'Members', value: membersTotal ?? 0, sub: 'active' },
  ];

  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-[18px]">
      {/* Header */}
      <div className="font-ethiopic text-xs font-medium tracking-[0.06em] text-gold-deep dark:text-gold">
        የአስተዳዳሪ ክፍል
      </div>
      <h1 className="mt-1 font-display text-[38px] font-medium leading-none text-burgundy-ink dark:text-cream">
        Admin <em className="text-burgundy dark:text-gold">panel</em>
      </h1>
      <div
        className="mb-[22px] mt-3.5 h-0.5 w-12"
        style={{ background: 'linear-gradient(to right, #D4A843, transparent)' }}
      />

      {/* Today summary strip */}
      <div className="relative mb-[22px] overflow-hidden rounded-2xl border border-border bg-card px-3.5 py-3">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-2 -top-2 font-ethiopic text-[70px] leading-none text-gold/[0.06]"
        >
          ✣
        </span>
        <div className="grid grid-cols-3">
          {stats.map((s, i) => (
            <div
              key={s.en}
              className={i ? 'border-l border-border pl-3.5' : ''}
            >
              <div className="font-ethiopic text-[9.5px] tracking-[0.05em] text-gold-deep dark:text-gold">
                {s.am}
              </div>
              <div className="mt-0.5 font-display text-[26px] font-medium leading-none tabular-nums text-burgundy dark:text-gold">
                {s.value.toLocaleString()}
              </div>
              <div className="mt-0.5 text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Link cards */}
      <div className="flex flex-col gap-3">
        {visibleLinks.map((link) => {
          const featured = link.featured;
          const Icon = link.icon;
          const badge =
            link.showBadge && (pendingDonations ?? 0) > 0
              ? `${pendingDonations} pending`
              : null;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative overflow-hidden rounded-2xl px-[18px] py-[18px] pl-[22px] transition-all hover:-translate-y-0.5 ${
                featured
                  ? 'sacred-gradient border border-gold/30 text-cream shadow-fy-lg'
                  : 'gold-accent-l border border-border bg-card shadow-fy-md'
              }`}
            >
              {featured && (
                <div className="tibeb-gold absolute inset-0 opacity-40" />
              )}
              <div className="relative flex items-start gap-3.5">
                <div
                  className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl ${
                    featured
                      ? 'border border-gold/35 bg-cream/[0.12]'
                      : 'bg-gold/[0.16]'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      featured
                        ? 'text-gold'
                        : 'text-gold-deep dark:text-gold'
                    }`}
                    strokeWidth={1.75}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div
                      className={`font-ethiopic text-[10px] font-medium tracking-[0.04em] ${
                        featured ? 'text-cream/60' : 'text-gold-deep dark:text-gold'
                      }`}
                    >
                      {link.am}
                    </div>
                    {badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9.5px] font-semibold tracking-wider ${
                          featured
                            ? 'bg-gold/25 text-gold'
                            : 'bg-status-late-bg text-status-late'
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </div>
                  <h3
                    className={`mb-1.5 font-display text-[22px] font-medium leading-[1.05] ${
                      featured ? 'text-cream' : 'text-burgundy-ink dark:text-cream'
                    }`}
                  >
                    {link.en}
                  </h3>
                  <p
                    className={`text-xs leading-snug ${
                      featured ? 'text-cream/70' : 'text-muted-foreground'
                    }`}
                  >
                    {link.description}
                  </p>
                  <div
                    className={`mt-2.5 inline-flex items-center gap-1 text-xs font-semibold ${
                      featured ? 'text-gold' : 'text-burgundy dark:text-gold'
                    }`}
                  >
                    {link.cta}
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
