import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Bot } from 'lucide-react';
import { Card, PageHead, StatusPill, type StatusTone } from '@/components/ds';
import { AutoRefresh } from '@/components/auto-refresh';
import { BroadcastStatusPill } from '@/components/messages/broadcast-status';
import {
  formatScheduled,
  formatSentAt,
  MESSAGE_AUDIENCE_LABEL,
  messageSizeLabel,
  SKIP_LABEL,
} from '@/components/messages/format';
import { getLocale, getT } from '@/lib/i18n/server';
import { canCancelBroadcast, canEditBroadcast, canViewBroadcast } from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import type { SkipReason } from '@/lib/sms/message-audience';
import { loadBroadcast, loadRecipients, loadTargetOptions } from '@/lib/sms/message-queries';
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
 * resume, and every recipient with a masked number. A scheduled one: its
 * time, Edit and Cancel, no recipients yet. Permission: canViewBroadcast.
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
  const scheduled = b.status === 'scheduled';
  // Scheduled, missed, or cancelled before it went out: no recipients.
  const notStarted =
    scheduled ||
    b.status === 'missed' ||
    (!!b.scheduledAt && recipients.length === 0);
  const open = active || scheduled || b.status === 'paused';
  const mayChange = canCancelBroadcast(user, b);
  const mayEdit = scheduled && canEditBroadcast(user, b);
  const total = b.totals.queued + b.totals.sending + b.totals.sent + b.totals.failed;
  const finished = b.totals.sent + b.totals.failed;
  const pct = total ? Math.round((finished / total) * 100) : 100;
  const sig = signatureSuffix(smsSignature());
  // Audience 'selected' before it went out: the chosen people.
  const chosen =
    notStarted && b.audience === 'selected' ? await loadTargetOptions(b.id) : [];

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
            <BroadcastActions
              id={b.id}
              canCancel={open}
              canResume={b.status === 'paused'}
              editHref={mayEdit ? `/admin/messages/${b.id}/edit` : null}
              scheduled={scheduled}
            />
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
            {scheduled && b.scheduledAt && (
              <p className="rounded-[10px] border border-gold/40 bg-gold/10 px-3 py-2 text-[12px] text-ink dark:bg-gold/[0.06]">
                <span className="font-semibold">
                  {t('Goes out {when}.', { when: formatScheduled(b.scheduledAt, locale) })}
                </span>{' '}
                {b.audience === 'selected'
                  ? t('Each person is checked again when it goes out.')
                  : t('Recipients are worked out when it goes out.')}
              </p>
            )}
            {b.status === 'missed' && (
              <p className="rounded-[10px] border border-status-absent/30 bg-status-absent-bg px-3 py-2 text-[12px] text-status-absent">
                {t('Not sent: the server was down at the time.')}
              </p>
            )}
            {b.status === 'paused' && b.pauseReason && (
              <p role="status" className="rounded-[10px] border border-status-late/30 bg-status-late-bg px-3 py-2 text-[12px] text-status-late">
                {t('Paused')}: {b.pauseReason}
              </p>
            )}
            {!notStarted && (<>
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
            </>)}
            <dl className="space-y-1 border-t border-parchment-edge pt-3 text-[12px]">
              <Row label={t('Audience')}>
                {b.audience === 'selected'
                  ? t('Selected people ({n})', { n: b.targetCount })
                  : b.audience === 'event' && b.eventTitle
                  ? `${t('Event')}: ${b.eventTitle}`
                  : t(MESSAGE_AUDIENCE_LABEL[b.audience])}
              </Row>
              <Row label={t('Sender')}>{b.senderName ?? '—'}</Row>
              <Row label={t('Created')}>{formatSentAt(b.createdAt, locale)}</Row>
              {b.scheduledAt && (
                <Row label={t('Scheduled for')}>{formatScheduled(b.scheduledAt, locale)}</Row>
              )}
              {b.startedAt && <Row label={t('Started')}>{formatSentAt(b.startedAt, locale)}</Row>}
              {b.finishedAt && <Row label={t('Finished')}>{formatSentAt(b.finishedAt, locale)}</Row>}
              <Row label={t('Channel')}>SMS</Row>
            </dl>
          </Card>

          <section>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
              {t(...messageSizeLabel(b.parts.length, b.smsParts))}
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
            {chosen.length > 0 ? t('Selected people') : t('Recipients')}
            {!notStarted && ` · ${recipients.length}`}
            {chosen.length > 0 && ` · ${chosen.length}`}
          </div>
          {chosen.length > 0 && (
            <>
              {scheduled && (
                <p className="border-b border-parchment-edge px-4 py-2.5 text-[11.5px] text-ink-muted">
                  {t('Each person is checked again when it goes out: anyone who has left, turned off SMS, lost their number or is a child member by then is skipped.')}
                </p>
              )}
              <ul className="divide-y divide-parchment-edge">
                {chosen.map((p) => (
                  <li key={`${p.kind}:${p.id}`} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-ink">
                        {p.name} {p.fatherName}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-2 font-mono text-[10.5px] text-ink-muted">
                        <span>{p.code}</span>
                        {p.kind === 'pre_member' && <span className="font-body text-pre">{t('Pre-member')}</span>}
                      </div>
                    </div>
                    {p.reason && (
                      <span className="shrink-0 text-[10.5px] font-medium text-status-absent">
                        {t(SKIP_LABEL[p.reason])}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
          {notStarted && chosen.length === 0 && (
            <p className="px-4 py-6 text-center text-[12.5px] text-ink-muted">
              {scheduled
                ? t('Recipients are worked out when it goes out: people who join, leave or turn off SMS before then are handled.')
                : t('Nobody received this message.')}
            </p>
          )}
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
                      : // Numbered parts sent (broadcasts from before #150 only).
                        [b.parts.length > 1 ? `${r.partsSent}/${b.parts.length}` : null, r.errorType]
                          .filter(Boolean)
                          .join(' · ')}
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
