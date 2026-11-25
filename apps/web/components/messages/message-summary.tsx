import { AlertTriangle } from 'lucide-react';
import { intlLocale, type Locale } from '@/lib/i18n/config';
import type { Translate } from '@/lib/i18n/translate';
import { cn } from '@/lib/utils';
import { formatSentAt } from './format';

export interface SummaryTiles {
  balance: number | null;
  /** Credits the scheduled work of the next 7 days needs. */
  needed: number;
  sent: number;
  people: number;
  credits: number;
  scheduled: number;
  next: Date | null;
  failed: number;
  /** "since Hidar 1" / "all time" (already translated). */
  sinceLabel: string;
  /** "Hidar 2019" / "All time" (already translated). */
  periodLabel: string;
}

export const fmtNumber = (n: number, locale: Locale) =>
  new Intl.NumberFormat(intlLocale(locale)).format(n);
const fmt = fmtNumber;

function Tile({
  label,
  value,
  sub,
  alert = false,
}: {
  label: string;
  value: string;
  sub: string;
  alert?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-[14px] border border-parchment-edge bg-parchment-soft px-3.5 py-3">
      <dt className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-deep">
        {label}
      </dt>
      <dd
        className={cn(
          'mt-1 font-mono text-[20px] font-semibold leading-tight tabular-nums',
          alert ? 'text-status-absent' : 'text-brand-ink',
        )}
      >
        {value}
      </dd>
      <dd className="mt-0.5 text-[11px] leading-snug text-ink-muted">{sub || ' '}</dd>
    </div>
  );
}

/**
 * Six tiles: balance and scheduled work (whole scope), sent, people reached,
 * credits used and failed (period and sender filters).
 */
export function MessageSummaryTiles({
  s,
  t,
  locale,
}: {
  s: SummaryTiles;
  t: Translate;
  locale: Locale;
}) {
  const low = s.balance !== null && s.balance < s.needed;
  return (
    <dl className="mb-4 grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
      <Tile
        label={t('Credit balance')}
        value={s.balance === null ? '—' : fmt(s.balance, locale)}
        sub={s.needed > 0 ? t('Scheduled messages need {n}', { n: fmt(s.needed, locale) }) : ''}
        alert={low}
      />
      <Tile label={t('Sent')} value={fmt(s.sent, locale)} sub={s.sinceLabel} />
      <Tile
        label={t('People reached')}
        value={fmt(s.people, locale)}
        sub={t('one or more messages')}
      />
      <Tile label={t('Credits used')} value={fmt(s.credits, locale)} sub={s.periodLabel} />
      <Tile
        label={t('Scheduled')}
        value={fmt(s.scheduled, locale)}
        sub={
          s.next
            ? t('next: {when}', { when: formatSentAt(s.next, locale) })
            : t('none')
        }
      />
      <Tile
        label={t('Failed')}
        value={fmt(s.failed, locale)}
        sub={s.periodLabel}
        alert={s.failed > 0}
      />
    </dl>
  );
}

/** Shown when the balance does not cover the scheduled work of the next 7 days. */
export function CreditWarning({
  at,
  needed,
  balance,
  t,
  locale,
}: {
  at: Date;
  needed: number;
  balance: number;
  t: Translate;
  locale: Locale;
}) {
  return (
    <p
      role="status"
      className="mb-4 flex items-start gap-2 rounded-[10px] border border-status-absent/30 bg-status-absent-bg px-3.5 py-2.5 text-[12px] text-status-absent"
    >
      <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
      <span>
        {t(
          'Not enough credits for the message scheduled for {when}. It needs about {n} and the balance is {m}.',
          { when: formatSentAt(at, locale), n: fmt(needed, locale), m: fmt(balance, locale) },
        )}
      </span>
    </p>
  );
}
