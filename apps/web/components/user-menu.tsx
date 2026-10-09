'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import type { Role as UserRole } from '@felege-yordanos/db/schema';
import { authClient } from '@/lib/auth-client';
import { useT } from '@/lib/i18n/client';
import { isElevated } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { RoleBadge } from '@/components/role-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar } from './sidebar/sidebar-nav';

const itemClass =
  'cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] text-ink focus:bg-parchment-deep focus:text-ink';

/**
 * Name chip at the top right (top bar and mobile header). Opens the account
 * menu; notifications and settings join it once those pages exist.
 */
export function UserMenu({
  displayName,
  email,
  role,
  onDark = false,
}: {
  displayName: string;
  email: string;
  role: UserRole;
  /** Mobile header: light text on the brand gradient. */
  onDark?: boolean;
}) {
  const t = useT();
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('Account menu')}
        className={cn(
          'flex items-center gap-[7px] rounded-full border py-1 pl-[5px] pr-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold/40',
          onDark
            ? 'border-gold/20 bg-cream/[0.08] pr-2.5 hover:bg-cream/15'
            : 'border-parchment-edge bg-brand/[0.05] hover:bg-brand/[0.09] dark:bg-gold/[0.08] dark:hover:bg-gold/[0.14]',
        )}
      >
        <Avatar name={displayName} size={22} />
        <span
          className={cn(
            'truncate text-[11.5px] font-medium',
            onDark ? 'max-w-[72px] text-cream/85' : 'max-w-[140px] text-ink',
          )}
        >
          {displayName.split(' ')[0]}
        </span>
        {!onDark && isElevated(role) && <RoleBadge role={role} t={t} />}
        {!onDark && <ChevronDown className="h-3 w-3 text-ink-faint" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-xl border-parchment-edge bg-parchment-soft p-1.5 text-ink shadow-[0_12px_32px_-12px_rgba(10,60,54,0.35)] dark:bg-parchment-deep"
      >
        <DropdownMenuLabel className="flex items-center gap-2.5 px-2.5 py-2 font-normal">
          <Avatar name={displayName} size={34} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-brand-ink">
              {displayName}
            </p>
            <p className="truncate font-mono text-[10.5px] text-ink-muted">
              {email}
            </p>
            {isElevated(role) && (
              <RoleBadge role={role} t={t} className="mt-1 inline-block" />
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-parchment-edge" />
        <DropdownMenuItem asChild className={itemClass}>
          <Link href="/profile">
            <UserRound className="text-gold-deep" />
            {t('My profile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-parchment-edge" />
        <DropdownMenuItem onSelect={signOut} className={itemClass}>
          <LogOut className="text-gold-deep" />
          {t('Sign out')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
