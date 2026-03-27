'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Music,
  CalendarCheck,
  Heart,
  Shield,
  User,
} from 'lucide-react';
import type { UserRole } from '@felege-yordanos/db';

const memberLinks = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/songbook', icon: Music, label: 'Songbook' },
  { href: '/attendance', icon: CalendarCheck, label: 'Attendance' },
  { href: '/donate', icon: Heart, label: 'Donate' },
];

const profileLink = { href: '/profile', icon: User, label: 'Profile' };
const adminLink = { href: '/admin', icon: Shield, label: 'Admin' };

interface BottomNavProps {
  role?: UserRole;
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const isAdmin =
    role && ['dept_head', 'admin', 'super_admin'].includes(role);
  const links = isAdmin
    ? [...memberLinks, adminLink]
    : [...memberLinks, profileLink];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#601924] shadow-[0_-2px_12px_rgba(0,0,0,0.15)]">
      <div className="mx-auto flex max-w-md justify-around">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            pathname === link.href ||
            (link.href !== '/dashboard' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-label transition-colors ${
                isActive
                  ? 'text-[#fed65b]'
                  : 'text-[#fef9ea]/50 hover:text-[#fef9ea]/70'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
