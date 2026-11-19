import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Bot, CalendarClock, MessageSquareText, Plus } from 'lucide-react';
import { Card, PageHead } from '@/components/ds';
import { primaryBtn } from '@/components/events/button-classes';
import { BroadcastStatusPill } from '@/components/messages/broadcast-status';
import { formatScheduled, formatSentAt, MESSAGE_AUDIENCE_LABEL } from '@/components/messages/format';
import { getLocale, getT } from '@/lib/i18n/server';
import { canSendMessages, isSuperAdmin } from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import { listBroadcasts } from '@/lib/sms/message-queries';
import { smsStatus } from '@/lib/sms/transport';
import { cn } from '@/lib/utils';

/**
 * Message history: super admins see every broadcast, department heads with
 * the right their own. Permission: canSendMessages.
 */
export default async function MessagesPage() {
  const user = await requireUser();
  if (!canSendMessages(user)) redirect('/admin');
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const broadcasts = await listBroadcasts(isSuperAdmin(user) ? null : user.id);
  const status = smsStatus();

  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4 md:mx-0 md:max-w-[1040px] md:px-7 md:py-7">
      <Link
        href="/admin"
        className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep transition-colors hover:text-brand md:hidden dark:hover:text-gold-light"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('Admin panel')}
      </Link>
      <PageHead
        en="Messages"
        am="መልዕክቶች"
        sub={
          isSuperAdmin(user)
            ? 'SMS notices and event reminders sent from the app.'
            : 'Your SMS notices and event reminders.'
        }
        actions={
          <Link href="/admin/messages/new" className={cn(primaryBtn, 'px-4 py-2.5 text-[12.5px]')}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('New message')}</span>
          </Link>
        }
      />

      {!status.configured && (
        <p className="mb-4 rounded-[10px] border border-status-late/30 bg-status-late-bg px-3.5 py-2.5 text-[12px] text-status-late">
          {t('SMS is not configured. Messages cannot be sent until the SMSHub key is set.')}
        </p>
      )}

      {broadcasts.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-12 text-center">
          <MessageSquareText className="h-8 w-8 text-gold-deep" />
          <p className="text-sm text-ink-muted">{t('No messages yet')}</p>
        </Card>
      ) : (
        <ul className="space-y-2.5">
          {broadcasts.map((b) => {
            const total = b.totals.queued + b.totals.sending + b.totals.sent + b.totals.failed;
            const finished = b.totals.sent + b.totals.failed;
            const pct = total ? Math.round((finished / total) * 100) : 100;
            return (
              <li key={b.id}>
                <Link
                  href={`/admin/messages/${b.id}`}
                  className="block rounded-2xl border border-parchment-edge bg-parchment-soft p-4 transition-colors hover:bg-parchment-deep/60 md:px-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <BroadcastStatusPill status={b.status} t={t} />
                    {b.origin === 'event_reminder' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-pre-mid px-2 py-[3px] text-[10.5px] font-semibold text-cream">
                        <Bot className="h-3 w-3" />
                        {t('Automatic')}
                      </span>
                    )}
                    <span className="rounded-full bg-parchment-deep px-2 py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                      SMS
                    </span>
                    <span className="ml-auto font-mono text-[11px] text-ink-muted">
                      {b.status === 'scheduled' && b.scheduledAt ? (
                        <>
                          <CalendarClock className="mr-1 inline h-3 w-3 align-[-2px]" />
                          {formatScheduled(b.scheduledAt, locale)}
                        </>
                      ) : (
                        formatSentAt(b.createdAt, locale)
                      )}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 font-ethiopic text-[13.5px] leading-[1.5] text-ink">
                    {b.text}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-muted">
                    <span>
                      {b.audience === 'selected'
                        ? t('Selected people ({n})', { n: b.targetCount })
                        : b.audience === 'event' && b.eventTitle
                        ? `${t('Event')}: ${b.eventTitle}`
                        : t(MESSAGE_AUDIENCE_LABEL[b.audience])}
                    </span>
                    {b.senderName && <span>· {b.senderName}</span>}
                    <span>· {t('{n} SMS per person', { n: b.partsCount })}</span>
                  </div>
                  {b.status === 'scheduled' ||
                  b.status === 'missed' ||
                  (b.scheduledAt && total + b.totals.skipped === 0) ? (
                    <p className="mt-2 text-[11.5px] text-ink-muted">
                      {b.status === 'missed'
                        ? t('Not sent: the server was down at the time.')
                        : b.status === 'scheduled'
                          ? b.audience === 'selected'
                            ? t('Each person is checked again when it goes out.')
                            : t('Recipients are worked out when it goes out.')
                          : t('Nobody received this message.')}
                    </p>
                  ) : (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-parchment-deep">
                      <div
                        className="h-full rounded-full bg-brand dark:bg-gold"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-ink-muted">
                      {t('{sent} sent · {failed} failed · {skipped} skipped', {
                        sent: b.totals.sent,
                        failed: b.totals.failed,
                        skipped: b.totals.skipped,
                      })}
                    </span>
                  </div>
                  )}
                  {b.status === 'paused' && b.pauseReason && (
                    <p className="mt-2 text-[11.5px] text-status-late">{b.pauseReason}</p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
