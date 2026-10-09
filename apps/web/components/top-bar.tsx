'use client';

import { usePathname } from 'next/navigation';
import { Bell, PanelLeft, Search } from 'lucide-react';
import type { Role as UserRole } from '@felege-yordanos/db/schema';
import { useLocale, useT } from '@/lib/i18n/client';
import { breadcrumbForPath } from '@/lib/nav';
import { LangToggle } from '@/components/lang-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserMenu } from '@/components/user-menu';
import { useSidebar } from './sidebar/sidebar-provider';

interface TopBarProps {
  displayName: string;
  email: string;
  role: UserRole;
}

/** Desktop top bar. Transparent: it sits on the page glow (see AppShell). */
export function TopBar({ displayName, email, role }: TopBarProps) {
  const pathname = usePathname();
  const { toggle } = useSidebar();
  const locale = useLocale();
  const t = useT();
  const crumb = breadcrumbForPath(pathname) ?? {
    labelEn: 'Home',
    labelAm: 'ዋና ገጽ',
  };

  return (
    <header className="print:hidden sticky top-0 z-30 hidden h-[54px] shrink-0 items-center gap-3.5 bg-transparent px-[18px] md:flex">
      <button
        type="button"
        onClick={toggle}
        aria-label={t('Toggle sidebar')}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-parchment-deep"
      >
        <PanelLeft className="h-[17px] w-[17px]" />
      </button>

      {/* Breadcrumb: current language leads */}
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 items-baseline gap-2"
      >
        {locale === 'am' ? (
          <>
            <span className="whitespace-nowrap font-ethiopic text-[13px] font-semibold text-ink">
              {crumb.labelAm}
            </span>
            <span className="font-ethiopic text-[9px] text-gold opacity-70">
              ✣
            </span>
            <span className="whitespace-nowrap text-[11px] text-gold-deep">
              {crumb.labelEn}
            </span>
          </>
        ) : (
          <>
            <span className="whitespace-nowrap font-ethiopic text-[11px] text-gold-deep">
              {crumb.labelAm}
            </span>
            <span className="font-ethiopic text-[9px] text-gold opacity-70">
              ✣
            </span>
            <span className="whitespace-nowrap text-[12.5px] font-semibold text-ink">
              {crumb.labelEn}
            </span>
          </>
        )}
      </nav>

      <div className="flex-1" />

      {/* Search: placeholder until global search ships */}
      <div
        aria-hidden
        className="hidden w-[280px] items-center gap-2 rounded-[10px] border border-parchment-edge bg-parchment px-2.5 py-[7px] shadow-[inset_0_1px_2px_rgba(10,60,54,0.04)] dark:bg-parchment-deep lg:flex"
      >
        <Search className="h-[13px] w-[13px] text-ink-faint" />
        <span className="flex-1 truncate text-xs text-ink-faint">
          {t('Search songs, members, events…')}
        </span>
        <kbd className="rounded-[5px] border border-parchment-edge px-[5px] py-px font-mono text-[9.5px] text-ink-faint">
          ⌘K
        </kbd>
      </div>

      <LangToggle />
      <ThemeToggle />

      <button
        type="button"
        aria-label={t('Notifications')}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-parchment-deep"
      >
        <Bell className="h-4 w-4" />
        <span className="absolute right-[7px] top-1.5 h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_5px_#D4A843]" />
      </button>

      <span className="h-[22px] w-px bg-parchment-edge" />

      <UserMenu displayName={displayName} email={email} role={role} />
    </header>
  );
}
