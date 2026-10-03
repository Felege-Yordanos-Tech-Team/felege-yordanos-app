import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { DonationStatus } from '@felege-yordanos/db/schema';
import { Card, SectionHeader, StatusPill } from '@/components/ds';
import { paymentMethodLabel } from '@/lib/format';
import { getLocale, getT } from '@/lib/i18n/server';
import { formatAmount, shortDateTime } from '../format';

interface LastDonation {
  amount: number;
  currency: string | null;
  paymentMethod: string | null;
  createdAt: Date | null;
  status: DonationStatus;
}

interface MyGivingCardProps {
  total: number;
  currency: string;
  last: LastDonation | null;
}

/** Right-column card: verified giving total + most recent verified donation. */
export async function MyGivingCard({
  total,
  currency,
  last,
}: MyGivingCardProps) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return (
    <Card>
      <SectionHeader en="My giving" am="መዋጮ" />
      <div className="mt-2.5 flex flex-wrap items-baseline gap-1.5">
        <span className="font-mono text-[22px] font-medium text-brand dark:text-gold-light">
          {formatAmount(total, currency, locale)}
        </span>
        <span className="text-[10.5px] text-ink-muted">
          {t('verified this year')}
        </span>
      </div>

      {last ? (
        <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-parchment-edge pt-2.5">
          <span className="min-w-0 truncate text-[11.5px] text-ink-muted">
            {t('Last:')} {formatAmount(last.amount, last.currency, locale)}
            {' · '}
            {t(paymentMethodLabel(last.paymentMethod))}
            {last.createdAt && ` · ${shortDateTime(last.createdAt, locale)}`}
          </span>
          {last.status === 'verified' && (
            <StatusPill tone="verified">{t('verified')}</StatusPill>
          )}
        </div>
      ) : (
        <Link
          href="/donate"
          className="mt-2.5 flex items-center gap-1 border-t border-parchment-edge pt-2.5 text-[12px] font-semibold text-gold-deep hover:underline"
        >
          {t('Make your first donation')}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </Card>
  );
}
