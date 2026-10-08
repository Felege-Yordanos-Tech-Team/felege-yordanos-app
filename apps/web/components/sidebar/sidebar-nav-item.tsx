'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { isActivePath, type NavItem } from '@/lib/nav';
import { useSidebar } from './sidebar-provider';

/** One sidebar row: Amharic label leads, English sits small on the right. */
export function SidebarNavItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const active = isActivePath(item, pathname);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? `${item.labelAm} · ${item.labelEn}` : undefined}
      className={cn(
        'flex items-center gap-[11px] rounded-[10px] transition-colors',
        collapsed ? 'mx-2.5 my-0.5 justify-center py-[11px]' : 'mx-3 my-px px-3 py-[9px]',
        active ? 'bg-gold/[0.13] text-gold' : 'text-cream/60 hover:bg-cream/[0.06] hover:text-cream/85',
      )}
    >
      <Icon className={cn('shrink-0', collapsed ? 'h-5 w-5' : 'h-[17px] w-[17px]')} strokeWidth={active ? 2 : 1.7} />
      {!collapsed && (
        <>
          <span
            className={cn(
              'min-w-0 flex-1 overflow-hidden whitespace-nowrap font-ethiopic text-[12.5px] tracking-[0.02em]',
              active ? 'font-semibold' : 'font-medium',
            )}
          >
            {item.labelAm}
          </span>
          <span className={cn('whitespace-nowrap text-[10.5px]', active ? 'opacity-85' : 'opacity-55')}>
            {item.labelEn}
          </span>
        </>
      )}
    </Link>
  );
}
