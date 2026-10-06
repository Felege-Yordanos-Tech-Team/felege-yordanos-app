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
} from 'lucide-react';
import type { Role as UserRole } from '@felege-yordanos/db/schema';
import { useLocale } from '@/lib/i18n/client';
import { isElevated } from '@/lib/nav';
import { cn } from '@/lib/utils';

// Short Amharic labels so they fit one line under the icons.
const MEMBER_LINKS = [
  { href: '/dashboard', icon: Home, label: 'Home', am: 'ዋና ገጽ' },
  { href: '/notices', icon: Megaphone, label: 'Notices', am: 'ማስታወቂያ' },
  { href: '/songbook', icon: Music, label: 'Songbook', am: 'መዝሙር' },
  { href: '/attendance', icon: CalendarCheck, label: 'Events', am: 'መርሃ ግብር' },
];

/** Mobile bottom nav. 5th tab: Admin for elevated roles, Donate otherwise. */
export function BottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const locale = useLocale();
  const links = [
    ...MEMBER_LINKS,
    isElevated(role)
      ? { href: '/admin', icon: Shield, label: 'Admin', am: 'አስተዳደር' }
      : { href: '/donate', icon: Heart, label: 'Donate', am: 'መዋጮ' },
  ];

  return (
    <nav className="print:hidden fixed inset-x-0 bottom-0 z-50 border-t border-gold/25 bg-gradient-to-b from-brand-mid to-brand-deep pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 md:hidden">
      <div className="mx-auto flex max-w-[480px] items-end justify-around">
        {links.map(({ href, icon: Icon, label, am }) => {
          const active =
            pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(`${href}/`)) ||
            pathname === href;
          return (
            <Link
              key={href}
              href={href}
              prefetch
              aria-current={active ? 'page' : undefined}
              className="relative flex flex-1 flex-col items-center gap-[3px] px-1 pb-1 pt-2"
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-6 rounded-sm bg-gold shadow-[0_0_8px_#D4A843]" />
              )}
              <Icon
                className={cn(
                  'h-5 w-5',
                  active ? 'text-gold' : 'text-cream/45',
                )}
                strokeWidth={active ? 2 : 1.6}
              />
              <span
                className={cn(
                  'whitespace-nowrap text-[9.5px] tracking-[0.04em]',
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
