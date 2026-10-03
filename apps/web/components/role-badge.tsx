import type { Role } from '@felege-yordanos/db/schema';
import type { Translate } from '@/lib/i18n/translate';
import { cn } from '@/lib/utils';

const ROLE_EN: Record<Role, string> = {
  member: 'member',
  dept_head: 'dept head',
  admin: 'admin',
  super_admin: 'super admin',
};

/** Human label for a role, translated ("super admin" / "ዋና አስተዳዳሪ"). */
export const roleLabel = (role: Role, t: Translate) => t(ROLE_EN[role]);

/** Small uppercase role pill: gold text on brand. */
export function RoleBadge({ role, t, className }: { role: Role; t: Translate; className?: string }) {
  return (
    <span
      className={cn(
        'whitespace-nowrap rounded-full bg-brand px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.12em] text-gold',
        className,
      )}
    >
      {roleLabel(role, t)}
    </span>
  );
}
