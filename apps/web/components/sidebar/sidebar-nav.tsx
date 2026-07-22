'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronsLeft, ChevronsRight, LogOut } from 'lucide-react';
import { createClient } from '@felege-yordanos/db';
import type { UserRole } from '@felege-yordanos/db';
import { cn, initials } from '@/lib/utils';
import { navForRole } from '@/lib/nav';
import { useSidebar } from './sidebar-provider';
import { SidebarNavItem } from './sidebar-nav-item';

interface SidebarNavProps {
  role: UserRole;
  displayName: string;
}

/** Desktop-only left rail (hidden on mobile — the bottom nav owns that). */
export function SidebarNav({ role, displayName }: SidebarNavProps) {
  const { collapsed, toggle } = useSidebar();
  const { member, admin } = navForRole(role);
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside
      className={cn(
        'rail-sacred sticky top-0 z-40 hidden h-screen shrink-0 flex-col text-cream md:flex',
        collapsed ? 'w-[72px]' : 'w-[224px]',
      )}
    >
      {/* Brand */}
      <Link
        href="/dashboard"
        className={cn(
          'flex items-center gap-2.5 px-4 py-4',
          collapsed && 'justify-center px-0',
        )}
      >
        <img
          src="/ss-logo.png"
          alt=""
          className="h-9 w-9 shrink-0 rounded-full border border-gold/30"
        />
        {!collapsed && (
          <span className="flex flex-col leading-tight">
            <span className="font-ethiopic text-[15px] font-semibold text-cream">
              ፈለገ ዮርዳኖስ
            </span>
            <span className="font-display text-[11px] italic text-gold-light/80">
              Sunday School
            </span>
          </span>
        )}
      </Link>

      {/* Sections */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2">
        <SidebarSection label="Member" labelAm="አባል" collapsed={collapsed} />
        <ul className="space-y-1">
          {member.map((item) => (
            <li key={item.href}>
              <SidebarNavItem item={item} />
            </li>
          ))}
        </ul>

        {admin.length > 0 && (
          <>
            <SidebarSection
              label="Admin"
              labelAm="አስተዳደር"
              collapsed={collapsed}
              className="mt-5"
            />
            <ul className="space-y-1">
              {admin.map((item) => (
                <li key={item.href}>
                  <SidebarNavItem item={item} />
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* Footer: collapse toggle + user */}
      <div className="border-t border-cream/10 px-2.5 py-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-cream/60 transition-colors hover:bg-cream/10 hover:text-cream',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4" />
              Collapse
            </>
          )}
        </button>

        <div
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-3 py-2',
            collapsed && 'justify-center px-0',
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-[11px] font-semibold text-burgundy-ink">
            {initials(displayName)}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-cream">
                  {displayName}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-gold-light/70">
                  {role.replace('_', ' ')}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign out"
                className="text-cream/50 transition-colors hover:text-cream"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

interface SidebarSectionProps {
  label: string;
  labelAm: string;
  collapsed: boolean;
  className?: string;
}

/** Section heading — collapses to a thin divider when the rail is narrow. */
function SidebarSection({
  label,
  labelAm,
  collapsed,
  className,
}: SidebarSectionProps) {
  if (collapsed) {
    return <div className={cn('mx-3 my-2 h-px bg-cream/10', className)} />;
  }
  return (
    <div className={cn('px-3 pb-1.5 pt-1', className)}>
      <span className="font-label text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-light/60">
        {label}
      </span>
      <span className="ml-1.5 font-ethiopic text-[10px] text-cream/30">
        · {labelAm}
      </span>
    </div>
  );
}
