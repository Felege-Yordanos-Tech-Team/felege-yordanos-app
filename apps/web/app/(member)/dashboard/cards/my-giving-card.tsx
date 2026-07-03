import Link from 'next/link';
import { BadgeCheck, ArrowRight } from 'lucide-react';
import { formatMoney, formatShortDate, paymentMethodLabel } from '@/lib/format';

interface LastDonation {
  amount: number;
  currency: string;
  payment_method: string | null;
  created_at: string;
  status: 'pending' | 'verified' | 'rejected';
}

interface MyGivingCardProps {
  total: number;
  currency: string;
  last: LastDonation | null;
}

/** Right-column card: verified giving total + most recent donation. */
export function MyGivingCard({ total, currency, last }: MyGivingCardProps) {
  return (
    <section className="gold-accent-t rounded-2xl border border-border bg-card p-5 shadow-fy-sm">
      <div className="font-ethiopic text-[11px] font-medium tracking-[0.08em] text-gold-deep dark:text-gold">
        ልገሳ
      </div>
      <h2 className="mb-3 font-display text-[22px] font-medium leading-none text-burgundy-ink dark:text-cream">
        My giving
      </h2>

      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[28px] font-semibold tracking-tight text-burgundy dark:text-gold">
          {currency} {formatMoney(total)}
        </span>
        <span className="text-xs text-muted-foreground">verified this year</span>
      </div>

      {last ? (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
          <div className="min-w-0 text-[13px] text-foreground">
            <span className="text-muted-foreground">Last: </span>
            <span className="font-mono">
              {last.currency} {formatMoney(last.amount)}
            </span>
            <span className="text-muted-foreground">
              {' · '}
              {paymentMethodLabel(last.payment_method)}
              {' · '}
              {formatShortDate(last.created_at)}
            </span>
          </div>
          {last.status === 'verified' && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-status-present-bg px-2 py-0.5 text-[10px] font-semibold text-status-present">
              <BadgeCheck className="h-3 w-3" />
              verified
            </span>
          )}
        </div>
      ) : (
        <Link
          href="/donate"
          className="mt-4 inline-flex items-center gap-1 border-t border-border pt-3 text-[13px] font-medium text-gold-deep hover:underline dark:text-gold"
        >
          Make your first donation
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </section>
  );
}
