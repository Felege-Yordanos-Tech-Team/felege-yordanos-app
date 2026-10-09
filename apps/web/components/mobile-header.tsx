'use client';

import Link from 'next/link';
import type { Role as UserRole } from '@felege-yordanos/db/schema';
import { useT } from '@/lib/i18n/client';
import { isElevated } from '@/lib/nav';
import { LogoMedallion } from '@/components/brand/logo-medallion';
import { LangToggle } from '@/components/lang-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { roleLabel } from '@/components/role-badge';
import { UserMenu } from '@/components/user-menu';

/** Mobile header. Hidden on desktop, where the top bar is used. */
export function MobileHeader({
  displayName,
  email,
  role,
}: {
  displayName: string;
  email: string;
  role: UserRole;
}) {
  const t = useT();
  return (
    <header className="print:hidden sticky top-0 z-50 flex items-center justify-between gap-2 border-b border-gold/15 bg-gradient-to-b from-brand to-brand-mid px-4 pb-3 pt-2.5 md:hidden">
      <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
        <LogoMedallion size={36} />
        <div className="min-w-0">
          <div className="truncate font-ethiopic text-base font-semibold leading-tight tracking-[0.01em] text-cream">
            ፈለገ ዮርዳኖስ
          </div>
          {isElevated(role) && (
            <span className="mt-[3px] inline-block text-[9px] font-semibold uppercase tracking-[0.18em] text-gold">
              {roleLabel(role, t)}
            </span>
          )}
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        <LangToggle onDark />
        <MobileThemeToggle />
        <UserMenu displayName={displayName} email={email} role={role} onDark />
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
