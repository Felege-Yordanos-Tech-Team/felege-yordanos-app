'use client';

import { useT } from '@/lib/i18n/client';
import type { SelectionSummary, SkipReason } from '@/lib/sms/message-audience';
import { estimateCredits } from '@/lib/sms/split';
import { cn } from '@/lib/utils';
import { SKIP_LABEL } from './format';


/**
 * Recipients, skipped people by reason, estimated credits and the balance.
 * Counts only: no names, no numbers.
 */
export function SmsEstimate({
  summary,
  parts,
  balance,
  hasBalance,
  loading,
  className,
}: {
  summary: SelectionSummary | null;
  parts: number;
  balance: number | null;
  hasBalance: boolean;
  loading?: boolean;
  className?: string;
}) {
  const t = useT();
  const credits = summary ? estimateCredits(parts, summary) : 0;
  const short = hasBalance && balance !== null && summary && credits > balance;
  const skipped = summary
    ? (Object.entries(summary.skipped) as [SkipReason, number][]).filter(
        ([, n]) => n > 0,
      )
    : [];
  return (
    <div
      className={cn(
        'rounded-[12px] border border-parchment-edge bg-parchment-soft p-3.5 dark:bg-parchment-deep',
        loading && 'opacity-60',
        className,
      )}
      aria-busy={loading}
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[12px]">
        <Stat
          label={t('Recipients')}
          value={summary ? summary.recipients : '…'}
          sub={
            summary && summary.safaricom > 0
              ? t('{n} Safaricom', { n: summary.safaricom })
              : undefined
          }
        />
        <Stat label={t('SMS parts per person')} value={parts || '—'} />
        <Stat
          label={t('Estimated credits')}
          value={summary && parts ? credits : '—'}
          tone={short ? 'bad' : undefined}
        />
        <Stat
          label={t('Balance')}
          value={hasBalance ? (balance ?? '—') : t('n/a')}
          sub={hasBalance ? undefined : t('Development: nothing is sent')}
        />
      </dl>
      {skipped.length > 0 && (
        <div className="mt-3 border-t border-parchment-edge pt-2.5">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
            {t('Skipped')}
          </div>
          <ul className="space-y-0.5 text-[11.5px] text-ink-muted">
            {skipped.map(([reason, n]) => (
              <li key={reason} className="flex justify-between gap-3">
                <span>{t(SKIP_LABEL[reason])}</span>
                <span className="font-mono">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {short && (
        <p role="alert" className="mt-2.5 text-[11.5px] font-medium text-status-absent">
          {t('Not enough SMS credits for this message.')}
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: 'bad';
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
        {label}
      </dt>
      <dd
        className={cn(
          'mt-0.5 font-mono text-[17px] font-semibold text-brand-ink',
          tone === 'bad' && 'text-status-absent',
        )}
      >
        {value}
      </dd>
      {sub && <dd className="text-[10.5px] text-ink-muted">{sub}</dd>}
    </div>
  );
}
