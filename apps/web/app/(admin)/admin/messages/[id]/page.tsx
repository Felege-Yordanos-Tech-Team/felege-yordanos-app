import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Bot } from 'lucide-react';
import { Card, PageHead, StatusPill, type StatusTone } from '@/components/ds';
import { AutoRefresh } from '@/components/auto-refresh';
import { BroadcastStatusPill } from '@/components/messages/broadcast-status';
import { formatSentAt, MESSAGE_AUDIENCE_LABEL, SKIP_LABEL } from '@/components/messages/format';
import { getLocale, getT } from '@/lib/i18n/server';
import { canCancelBroadcast, canViewBroadcast } from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import type { SkipReason } from '@/lib/sms/message-audience';
import { loadBroadcast, loadRecipients } from '@/lib/sms/message-queries';
import { signatureSuffix } from '@/lib/sms/split';
import { smsSignature } from '@/lib/sms/transport';
import { BroadcastActions } from './broadcast-actions';

const RECIPIENT_TONE: Record<string, StatusTone> = {
  queued: 'neutral',
  sending: 'upcoming',
  sent: 'verified',
  failed: 'rejected',
  skipped: 'neutral',
};
const RECIPIENT_LABEL: Record<string, string> = {
  queued: 'Waiting',
  sending: 'In progress',
  sent: 'Sent',
  failed: 'Failed',
  skipped: 'Skipped',
};

/**
 * One broadcast: progress (refreshed every 3 s while sending), cancel and
 * resume, and every recipient with a masked number.
 * Permission: canViewBroadcast.
 */
export default async function BroadcastPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const b = await loadBroadcast(id);
  if (!b || !canViewBroadcast(user, b)) notFound();
  const [t, locale, recipients] = await Promise.all([getT(), getLocale(), loadRecipients(b.id)]);

  const active = b.status === 'queued' || b.status === 'sending';
  const open = active || b.status === 'paused';
  const mayChange = canCancelBroadcast(user, b);
  const total = b.totals.queued + b.totals.sending + b.totals.sent + b.totals.failed;
  const finished = b.totals.sent + b.totals.failed;
  const pct = total ? Math.round((finished / total) * 100) : 100;
  const sig = signatureSuffix(smsSignature());

  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4 md:mx-0 md:max-w-[1040px] md:px-7 md:py-7">
      <AutoRefresh active={active} />
      <Link
        href="/admin/messages"
        className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep transition-colors hover:text-brand dark:hover:text-gold-light"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('Messages')}
      </Link>
      <PageHead
        en={b.origin === 'event_reminder' ? 'Event reminder' : 'SMS message'}
        am={b.origin === 'event_reminder' ? 'የመርሃ ግብር ማስታወሻ' : 'የSMS መልዕክት'}
        actions={
          mayChange ? (
            <BroadcastActions id={b.id} canCancel={open} canResume={b.status === 'paused'} />
          ) : undefined
        }
        className="flex-wrap"
      />

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:gap-6">
        <div className="space-y-4">
          <Card className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <BroadcastStatusPill status={b.status} t={t} />
              {b.origin === 'event_reminder' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-pre-mid px-2 py-[3px] text-[10.5px] font-semibold text-cream">
                  <Bot className="h-3 w-3" />
                  {t('Automatic')}
                </span>
              )}
            </div>
            {b.status === 'paused' && b.pauseReason && (
              <p role="status" className="rounded-[10px] border border-status-late/30 bg-status-late-bg px-3 py-2 text-[12px] text-status-late">
                {t('Paused')}: {b.pauseReason}
              </p>
            )}
            <div>
              <div className="mb-1 flex justify-between text-[11.5px] text-ink-muted">
                <span>{t('{done} of {total} people', { done: finished, total })}</span>
                <span className="font-mono">{pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-parchment-deep">
                <div className="h-full rounded-full bg-brand transition-[width] dark:bg-gold" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <dl className="grid grid-cols-4 gap-2 text-center">
              {(
                [
                  ['Sent', b.totals.sent],
                  ['Waiting', b.totals.queued + b.totals.sending],
                  ['Failed', b.totals.failed],
                  ['Skipped', b.totals.skipped],
                ] as const
              ).map(([label, n]) => (
                <div key={label} className="rounded-[10px] bg-parchment-deep/60 px-1 py-2">
                  <dt className="text-[9.5px] uppercase tracking-[0.1em] text-gold-deep">{t(label)}</dt>
                  <dd className="font-mono text-[16px] font-semibold text-brand-ink">{n}</dd>
                </div>
              ))}
            </dl>
            <dl className="space-y-1 border-t border-parchment-edge pt-3 text-[12px]">
              <Row label={t('Audience')}>
                {b.audience === 'event' && b.eventTitle
                  ? `${t('Event')}: ${b.eventTitle}`
                  : t(MESSAGE_AUDIENCE_LABEL[b.audience])}
              </Row>
              <Row label={t('Sender')}>{b.senderName ?? '—'}</Row>
              <Row label={t('Created')}>{formatSentAt(b.createdAt, locale)}</Row>
              {b.startedAt && <Row label={t('Started')}>{formatSentAt(b.startedAt, locale)}</Row>}
              {b.finishedAt && <Row label={t('Finished')}>{formatSentAt(b.finishedAt, locale)}</Row>}
              <Row label={t('Channel')}>SMS</Row>
            </dl>
          </Card>

          <section>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
              {t('{n} SMS per person', { n: b.parts.length })}
            </div>
            <ol className="space-y-2">
              {b.parts.map((p, i) => (
                <li key={i} className="rounded-[14px] rounded-bl-[4px] border border-parchment-edge bg-parchment px-3.5 py-2.5 font-ethiopic text-[13px] leading-[1.5] whitespace-pre-wrap text-ink dark:bg-parchment-deep">
                  {p}
                  <span className="text-ink-muted">{sig}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <Card className="p-0">
          <div className="border-b border-parchment-edge px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
            {t('Recipients')} · {recipients.length}
          </div>
          <ul className="divide-y divide-parchment-edge">
            {recipients.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-ink">{r.name}</div>
                  <div className="mt-0.5 flex flex-wrap gap-x-2 font-mono text-[10.5px] text-ink-muted">
                    <span>{r.code}</span>
                    {r.phone && <span>{r.phone}</span>}
                    {r.kind === 'pre_member' && <span className="font-body text-pre">{t('Pre-member')}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusPill tone={RECIPIENT_TONE[r.status]}>{t(RECIPIENT_LABEL[r.status])}</StatusPill>
                  <span className="text-[10.5px] text-ink-muted">
                    {r.status === 'skipped'
                      ? t(SKIP_LABEL[r.skipReason as SkipReason] ?? r.skipReason ?? '')
                      : `${r.partsSent}/${b.parts.length}${r.errorType ? ` · ${r.errorType}` : ''}`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right text-ink">{children}</dd>
    </div>
  );
}
