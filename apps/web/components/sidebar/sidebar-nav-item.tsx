'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { isActivePath, type NavItem } from '@/lib/nav';
import { useSidebar } from './sidebar-provider';

/** One sidebar row. Renders icon-only when the sidebar is collapsed. */
export function SidebarNavItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const active = isActivePath(item, pathname);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? `${item.labelEn} · ${item.labelAm}` : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        collapsed && 'justify-center px-0',
        active
          ? 'bg-gold/[0.13] font-semibold text-gold-light'
          : 'text-cream/70 hover:bg-cream/10 hover:text-cream',
      )}
    >
      {/* Subtle left indicator on the active row */}
      {active && !collapsed && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-gold"
        />
      )}
      <Icon
        className={cn('h-[18px] w-[18px] shrink-0', active && 'text-gold')}
        strokeWidth={active ? 2.25 : 1.9}
      />
      {!collapsed && (
        <span className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
          <span className="truncate">{item.labelEn}</span>
          <span
            className={cn(
              'font-ethiopic text-[11px]',
              active ? 'text-gold/70' : 'text-cream/40',
            )}
          >
            {item.labelAm}
          </span>
        </span>
      )}
    </Link>
  );
}
