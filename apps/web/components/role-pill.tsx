import type { Role } from '@felege-yordanos/db/schema';
import { roleLabel } from '@/components/role-badge';
import type { Translate } from '@/lib/i18n/translate';
import { cn } from '@/lib/utils';

/** Role tones. */
const TONES: Record<Role, string> = {
  member: 'bg-parchment-deep text-ink-muted dark:bg-ink-faint/[0.18]',
  dept_head: 'bg-gold/20 text-gold-deep dark:bg-gold/[0.18]',
  admin: 'bg-brand/[0.12] text-brand dark:bg-brand/30 dark:text-gold-light',
  super_admin: 'bg-brand text-gold',
};

export const ROLE_ORDER: Role[] = [
  'member',
  'dept_head',
  'admin',
  'super_admin',
];

/**
 * Tinted role pill, one tone per role. `table` is the desktop table badge
 * (bold, wider tracking); `list` is the phone list / legend variant.
 * Used by the users screen and the profile screen.
 */
export function RolePill({
  role,
  t,
  variant = 'table',
  className,
}: {
  role: Role;
  t: Translate;
  variant?: 'table' | 'list';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-block w-fit shrink-0 whitespace-nowrap rounded-full px-[9px] py-[3px] text-[9.5px] uppercase',
        variant === 'table'
          ? 'font-bold tracking-[0.1em]'
          : 'font-semibold tracking-[0.04em]',
        TONES[role],
        className,
      )}
    >
      {roleLabel(role, t)}
    </span>
  );
}

/** Two-letter initials for an avatar. */
export function initialsOf(
  ...candidates: (string | null | undefined)[]
): string {
  const source = candidates.find((c) => c && c.trim())?.trim() ?? '';
  if (!source) return '··';
  const parts = source.split(/\s+/).slice(0, 2);
  return parts.map((w) => w[0]?.toUpperCase() ?? '').join('') || '··';
}
