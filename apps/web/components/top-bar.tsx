'use client';

import { usePathname } from 'next/navigation';
import { Bell, PanelLeft, Search } from 'lucide-react';
import type { Role as UserRole } from '@felege-yordanos/db/schema';
import { Badge } from '@/components/ui/badge';
import { breadcrumbForPath } from '@/lib/nav';
import { initials } from '@/lib/utils';
import { useSidebar } from './sidebar/sidebar-provider';

interface TopBarProps {
  displayName: string;
  role: UserRole;
}

/** Desktop-only top bar: breadcrumb, (placeholder) search, notifications, user. */
export function TopBar({ displayName, role }: TopBarProps) {
  const pathname = usePathname();
  const { toggle } = useSidebar();
  const crumb = breadcrumbForPath(pathname);

  return (
    <header className="sticky top-0 z-30 hidden h-16 items-center gap-4 border-b border-parchment-edge bg-parchment/80 px-6 backdrop-blur md:flex">
      <button
        type="button"
        onClick={toggle}
        aria-label="Toggle sidebar"
        className="text-ink-muted transition-colors hover:text-burgundy"
      >
        <PanelLeft className="h-[18px] w-[18px]" />
      </button>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
        {crumb ? (
          <>
            <span className="font-ethiopic text-ink-muted">{crumb.labelAm}</span>
            <span className="text-parchment-edge">›</span>
            <span className="font-medium text-burgundy-ink">{crumb.labelEn}</span>
          </>
        ) : (
          <span className="font-medium text-burgundy-ink">Home</span>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        {/* Search — placeholder only (non-functional for now). */}
        <div className="relative hidden lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted/60" />
          <input
            type="text"
            readOnly
            tabIndex={-1}
            placeholder="Search songs, members, events…"
            aria-label="Search (coming soon)"
            className="h-9 w-[280px] cursor-default rounded-lg border border-parchment-edge bg-card pl-9 pr-12 text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-parchment-edge bg-parchment px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
            ⌘K
          </kbd>
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative text-ink-muted transition-colors hover:text-burgundy"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gold ring-2 ring-parchment" />
        </button>

        <div className="flex items-center gap-2 rounded-full border border-parchment-edge bg-card py-1 pl-1 pr-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-[10px] font-semibold text-burgundy-ink">
            {initials(displayName)}
          </div>
          <span className="text-xs font-medium text-burgundy-ink">
            {displayName.split(' ')[0]}
          </span>
          <Badge className="border border-gold/30 bg-gold/15 text-[9px] font-semibold uppercase tracking-wider text-gold-deep">
            {role.replace('_', ' ')}
          </Badge>
        </div>
      </div>
    </header>
  );
}
