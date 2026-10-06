'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronsLeft, ChevronsRight, LogOut } from 'lucide-react';
import type { Role as UserRole } from '@felege-yordanos/db/schema';
import { authClient } from '@/lib/auth-client';
import { useT } from '@/lib/i18n/client';
import { navForRole } from '@/lib/nav';
import { cn, initials } from '@/lib/utils';
import { LogoCross } from '@/components/brand/logo-cross';
import { roleLabel } from '@/components/role-badge';
import { useSidebar } from './sidebar-provider';
import { SidebarNavItem } from './sidebar-nav-item';

interface SidebarNavProps {
  role: UserRole;
  displayName: string;
}

/** Desktop left rail. Hidden on mobile, where the bottom nav takes over. */
export function SidebarNav({ role, displayName }: SidebarNavProps) {
  const { collapsed, toggle } = useSidebar();
  const { member, admin } = navForRole(role);
  const router = useRouter();
  const t = useT();

  async function handleLogout() {
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside
      className={cn(
        'print:hidden rail-sacred sticky top-0 z-40 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-gold/20 transition-[width] duration-200 md:flex',
        collapsed ? 'w-[68px]' : 'w-[236px]',
      )}
    >
      {/* Brand */}
      <Link
        href="/dashboard"
        className={cn(
          'flex shrink-0 items-center gap-2.5 px-[18px] pb-3.5 pt-4',
          collapsed && 'justify-center px-0',
        )}
      >
        <LogoCross size={34} />
        {!collapsed && (
          <span className="min-w-0 leading-tight">
            <span className="block whitespace-nowrap font-ethiopic text-[15px] font-semibold text-cream">
              ፈለገ ዮርዳኖስ
            </span>
            <span className="block whitespace-nowrap font-display text-[11.5px] italic text-gold-light/70">
              Sunday School
            </span>
          </span>
        )}
      </Link>

      <div
        className={cn(
          'mb-2 h-px shrink-0 bg-gold/20',
          collapsed ? 'mx-3.5' : 'mx-[18px]',
        )}
      />

      <nav className="flex-1 overflow-y-auto overflow-x-hidden pb-2 [scrollbar-width:none]">
        <SidebarSection en="Member" am="አባል" collapsed={collapsed} />
        {member.map((item) => (
          <SidebarNavItem key={item.href} item={item} />
        ))}

        {admin.length > 0 && (
          <>
            <SidebarSection
              en="Admin"
              am="አስተዳደር"
              collapsed={collapsed}
              admin
            />
            {admin.map((item) => (
              <SidebarNavItem key={item.href} item={item} />
            ))}
          </>
        )}
      </nav>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={toggle}
        aria-label={t(collapsed ? 'Expand sidebar' : 'Collapse sidebar')}
        className={cn(
          'mx-3 mb-1.5 flex shrink-0 items-center gap-2.5 rounded-[10px] px-3 py-2 text-cream/60 transition-colors hover:bg-cream/10 hover:text-cream',
          collapsed && 'mx-2.5 justify-center px-0',
        )}
      >
        {collapsed ? (
          <ChevronsRight className="h-4 w-4" />
        ) : (
          <ChevronsLeft className="h-4 w-4" />
        )}
        {!collapsed && (
          <span className="text-[11.5px] font-medium">{t('Collapse')}</span>
        )}
      </button>

      {/* User */}
      <div
        className={cn(
          'flex shrink-0 items-center gap-2.5 border-t border-gold/20 px-[18px] py-3',
          collapsed && 'justify-center px-0',
        )}
      >
        <Avatar name={displayName} size={30} />
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-cream">
                {displayName}
              </div>
              <div className="mt-px text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gold">
                {roleLabel(role, t)}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label={t('Sign out')}
              title={t('Sign out')}
              className="text-cream/60 transition-colors hover:text-cream"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

function SidebarSection({
  en,
  am,
  collapsed,
  admin,
}: {
  en: string;
  am: string;
  collapsed: boolean;
  admin?: boolean;
}) {
  if (collapsed) {
    return admin ? (
      <div className="mb-1 mt-3.5 text-center font-ethiopic text-[11px] text-gold/75">
        ✣
      </div>
    ) : (
      <div className="mt-1" />
    );
  }
  return (
    <div
      className={cn(
        'mb-[5px] flex items-baseline gap-1.5 px-[26px]',
        admin ? 'mt-3.5' : 'mt-1',
      )}
    >
      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gold/75">
        {en}
      </span>
      <span className="font-ethiopic text-[9.5px] text-gold/60">· {am}</span>
    </div>
  );
}

/** Gold initials avatar used in the sidebar, top bar and mobile header. */
export function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-deep font-display font-bold text-brand-deep"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {initials(name)}
    </div>
  );
}
