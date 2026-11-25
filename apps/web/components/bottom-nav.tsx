'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarCheck,
  Heart,
  Home,
  Megaphone,
  Music,
  Shield,
  User,
} from 'lucide-react';
import type { Role as UserRole } from '@felege-yordanos/db/schema';
import { useLocale } from '@/lib/i18n/client';
import { isElevated } from '@/lib/nav';
import { cn } from '@/lib/utils';

// Short Amharic tab labels; the sidebar and page titles keep the full names.
const MEMBER_LINKS = [
  { href: '/dashboard', icon: Home, label: 'Home', am: 'ዋና ገጽ' },
  { href: '/notices', icon: Megaphone, label: 'Notices', am: 'ማስታወቂያ' },
  { href: '/songbook', icon: Music, label: 'Songbook', am: 'መዝሙር' },
  { href: '/attendance', icon: CalendarCheck, label: 'Events', am: 'መርሃ ግብር' },
];

/**
 * Mobile bottom nav: a fully rounded pill floating clear of the screen's
 * rounded corners: 20 px + safe-area inset on the sides, max(16 px, home
 * indicator inset) below, height --bottom-nav-height (app/global.css).
 * 5th tab: Admin for elevated roles, Profile (their QR) for pre-members,
 * Donate otherwise. AppShell pads <main> with the same variables so the pill
 * never covers content.
 */
export function BottomNav({
  role,
  preMember = false,
}: {
  role: UserRole;
  preMember?: boolean;
}) {
  const pathname = usePathname();
  const locale = useLocale();
  const links = [
    ...MEMBER_LINKS,
    isElevated(role)
      ? { href: '/admin', icon: Shield, label: 'Admin', am: 'አስተዳዳሪ' }
      : preMember
        ? { href: '/profile', icon: User, label: 'Profile', am: 'መገለጫ' }
        : { href: '/donate', icon: Heart, label: 'Donate', am: 'መዋጮ' },
  ];

  return (
    <nav className="print:hidden pointer-events-none fixed inset-x-0 bottom-0 z-20 bg-transparent pb-[var(--bottom-nav-gap)] pl-[calc(20px+env(safe-area-inset-left,0px))] pr-[calc(20px+env(safe-area-inset-right,0px))] md:hidden">
      {/* p-1 (4 px) all round: the active pill (radius 23) is concentric
          with the bar (radius 28 minus border and padding). */}
      <div className="pointer-events-auto mx-auto flex h-[var(--bottom-nav-height)] max-w-[480px] items-stretch justify-around rounded-full border border-gold/[0.28] bg-gradient-to-b from-brand-mid to-brand-deep p-1 shadow-[0_14px_30px_-10px_rgba(7,43,38,0.55),0_4px_10px_-4px_rgba(7,43,38,0.35)]">
        {links.map(({ href, icon: Icon, label, am }) => {
          const active =
            pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              prefetch
              aria-current={active ? 'page' : undefined}
              className={cn(
                // 46 px high (bar 56 - border - padding): above the 44 px touch target.
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-[2px] rounded-full [transition:background_0.15s]',
                active && 'bg-gold/[0.16]',
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0',
                  active ? 'text-gold' : 'text-cream/45',
                )}
                strokeWidth={active ? 2 : 1.6}
              />
              {/* One line; short labels fit five tabs at 360 px. */}
              <span
                className={cn(
                  'whitespace-nowrap text-center leading-[1.15] tracking-normal',
                  locale === 'am'
                    ? 'font-ethiopic-sans text-[10px]'
                    : 'font-body text-[9.5px]',
                  active
                    ? 'font-semibold text-gold'
                    : 'font-medium text-cream/50',
                )}
              >
                {locale === 'am' ? am : label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
