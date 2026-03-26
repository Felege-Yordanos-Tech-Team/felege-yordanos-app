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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#8A2E3D] bg-[#6B1D2A]">
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
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors ${
                isActive
                  ? 'text-[#D4A843]'
                  : 'text-[#FFFDF7]/60 hover:text-[#FFFDF7]/80'
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
