'use client';

import Link from 'next/link';
import type { Role as UserRole } from '@felege-yordanos/db/schema';
import { useT } from '@/lib/i18n/client';
import { isElevated } from '@/lib/nav';
import { LogoCross } from '@/components/brand/logo-cross';
import { LangToggle } from '@/components/lang-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { roleLabel } from '@/components/role-badge';
import { Avatar } from './sidebar/sidebar-nav';

/** Mobile header. Hidden on desktop, where the top bar is used. */
export function MobileHeader({
  displayName,
  role,
}: {
  displayName: string;
  role: UserRole;
}) {
  const t = useT();
  return (
    <header className="print:hidden sticky top-0 z-50 flex items-center justify-between border-b border-gold/15 bg-gradient-to-b from-brand to-brand-mid px-4 pb-3 pt-2.5 md:hidden">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <LogoCross size={32} />
        <div>
          <div className="font-ethiopic text-base font-semibold leading-none tracking-[0.01em] text-cream">
            ፈለገ ዮርዳኖስ
          </div>
          {isElevated(role) && (
            <span className="mt-[3px] inline-block text-[9px] font-semibold uppercase tracking-[0.18em] text-gold">
              {roleLabel(role, t)}
            </span>
          )}
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <LangToggle onDark />
        <MobileThemeToggle />
        <Link
          href="/profile"
          className="flex items-center gap-1.5 rounded-full border border-gold/20 bg-cream/[0.08] py-[5px] pl-1.5 pr-2.5"
        >
          <Avatar name={displayName} size={22} />
          <span className="max-w-[80px] truncate text-[11px] font-medium text-cream/85">
            {displayName.split(' ')[0]}
          </span>
        </Link>
      </div>
    </header>
  );
}

function MobileThemeToggle() {
  return (
    <ThemeToggle
      onDark
      className="h-8 w-8 rounded-full border border-gold/20 bg-cream/[0.08] text-gold-light hover:bg-cream/15"
    />
  );
}
