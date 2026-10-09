'use client';

import {
  CalendarCheck,
  Church,
  HandCoins,
  Megaphone,
  TriangleAlert,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { NoticeCategory } from '@felege-yordanos/db/schema';
import { useLocale, useT } from '@/lib/i18n/client';
import { cn } from '@/lib/utils';

/** Icon and English label per notice type (order = the form's grid). */
export const NOTICE_CATEGORY_META: Record<
  NoticeCategory,
  { icon: LucideIcon; label: string }
> = {
  urgent: { icon: TriangleAlert, label: 'Urgent' },
  liturgical: { icon: Church, label: 'Liturgical' },
  event: { icon: CalendarCheck, label: 'Event' },
  fundraising: { icon: HandCoins, label: 'Fundraising' },
  community: { icon: Users, label: 'Community' },
  general: { icon: Megaphone, label: 'General' },
};

/** Type chip. `onDark` = on the green featured card. */
export function NoticeCategoryChip({
  category,
  onDark,
  className,
}: {
  category: NoticeCategory;
  onDark?: boolean;
  className?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const { icon: Icon, label } = NOTICE_CATEGORY_META[category];
  const urgent = category === 'urgent';
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[11px] font-semibold',
        locale === 'am' && 'font-ethiopic',
        onDark
          ? 'border-gold/40 bg-gold/[0.14] text-gold-light'
          : urgent
            ? 'border-status-absent/30 bg-status-absent-bg text-status-absent'
            : 'border-gold/35 bg-gold/[0.12] text-gold-deep',
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {t(label)}
    </span>
  );
}

/** Small gold dot for unread notices. */
export function UnreadDot({ className }: { className?: string }) {
  const t = useT();
  return (
    <span
      className={cn('h-[7px] w-[7px] shrink-0 rounded-full bg-gold', className)}
      role="img"
      aria-label={t('Unread')}
    />
  );
}
