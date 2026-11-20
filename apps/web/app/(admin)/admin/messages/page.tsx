import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, MessageSquareText, Plus } from 'lucide-react';
import { Card, PageHead } from '@/components/ds';
import { primaryBtn } from '@/components/events/button-classes';
import { MessageFilterBar } from '@/components/messages/message-filters';
import {
  MessageList,
  MessagePagination,
  type MessageListRow,
} from '@/components/messages/message-list';
import { CreditWarning, MessageSummaryTiles } from '@/components/messages/message-summary';
import { ETH_MONTHS, todayYmd } from '@/lib/events';
import { ETH_MONTHS_EN, ethiopianPeriodLabel } from '@/lib/ethiopian-periods';
import { getLocale, getT } from '@/lib/i18n/server';
import {
  canCancelBroadcast,
  canEditBroadcast,
  canSendMessages,
  isSuperAdmin,
} from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import {
  creditOutlook,
  DEFAULT_MESSAGE_FILTERS,
  messagesHref,
  paging,
  parseMessageFilters,
  periodBounds,
  senderScope,
} from '@/lib/sms/message-list';
import {
  createEstimator,
  estimateRows,
  hasAnyMessage,
  loadMessagePage,
  loadMessageSummary,
  loadScheduledWork,
  loadSenders,
  readBalance,
} from '@/lib/sms/message-list-queries';
import { smsStatus } from '@/lib/sms/transport';
import { cn } from '@/lib/utils';
import { ResumeButton } from './resume-button';

/**
 * Messages: summary tiles, filters in the URL, one page of broadcasts.
 * Super admins see every message (and can pick a sender), department heads
 * with the right their own; every number follows the same scope.
 * Permission: canSendMessages (rows: canEditBroadcast, canCancelBroadcast).
 */
export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  if (!canSendMessages(user)) redirect('/admin');
  const [t, locale, sp] = await Promise.all([getT(), getLocale(), searchParams]);
  const f = parseMessageFilters(sp);
  const superAdmin = isSuperAdmin(user);
  // Whose messages the list and the period tiles count; balance and
  // scheduled work always cover the user's whole scope.
  const createdBy = senderScope(f, { id: user.id, superAdmin });
  const ownScope = superAdmin ? null : user.id;
  const now = new Date();
  const period = periodBounds(f.period, todayYmd(now));
  const estimator = createEstimator();

  const [list, summary, scheduled, balance, senders, anyMessage] = await Promise.all([
    loadMessagePage({ filters: f, createdBy, period }),
    loadMessageSummary({ createdBy, period }),
    loadScheduledWork(ownScope, estimator),
    readBalance(),
    superAdmin ? loadSenders() : Promise.resolve(null),
    hasAnyMessage(ownScope),
  ]);
  const p = paging(list.total, f.page, f.per);
  const rows = await list.load(p.offset, f.per);
  const estimates = await estimateRows(rows, estimator);
  const outlook = creditOutlook(scheduled.items, balance, now);
  const status = smsStatus();

  const monthName = period
    ? (locale === 'am' ? ETH_MONTHS : ETH_MONTHS_EN)[(period.month.month ?? 1) - 1]
    : '';
  const periodLabel = period ? ethiopianPeriodLabel(period.month, locale) : t('All time');
  const periodOptions = [
    { value: 'this_month' as const, label: t('This month') },
    { value: 'last_month' as const, label: t('Last month') },
    { value: 'all' as const, label: t('All time') },
  ];

  const listRows: MessageListRow[] = rows.map((r) => ({
    id: r.id,
    text: r.text,
    status: r.status,
    automatic: r.origin === 'event_reminder',
    audience: r.audience,
    eventTitle: r.eventTitle,
    targetCount: r.targetCount,
    senderName: r.senderName,
    when: r.scheduledAt ?? r.createdAt,
    sent: r.sent,
    people: r.people,
    credits: r.credits,
    estimate: estimates.get(r.id) ?? null,
    canEdit: r.status === 'scheduled' && canEditBroadcast(user, r),
    canResume: r.status === 'paused' && canCancelBroadcast(user, r),
  }));

  // "Clear filters": every filter off (all time), rows per page kept.
  const cleared = { ...DEFAULT_MESSAGE_FILTERS, period: 'all' as const, per: f.per };
  const clearHref = messagesHref(cleared);
  const isCleared = messagesHref({ ...f, page: 1 }) === clearHref;

  const newButton = (
    <Link href="/admin/messages/new" className={cn(primaryBtn, 'px-4 py-2.5 text-[12.5px]')}>
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline">{t('New message')}</span>
      <span className="sr-only sm:hidden">{t('New message')}</span>
    </Link>
  );

  return (
    // From md up the page fills <main> (the desktop scroll container): a flex
    // column at least its height, the list card grows, the pages sit at the bottom.
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4 md:mx-0 md:flex md:min-h-full md:max-w-none md:flex-col md:px-7 md:py-7">
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
          superAdmin
            ? 'SMS notices and event reminders sent from the app.'
            : 'Your SMS notices and event reminders.'
        }
        actions={newButton}
      />

      {!status.configured && (
        <p className="mb-4 rounded-[10px] border border-status-late/30 bg-status-late-bg px-3.5 py-2.5 text-[12px] text-status-late">
          {t('SMS is not configured. Messages cannot be sent until the SMSHub key is set.')}
        </p>
      )}

      <MessageSummaryTiles
        t={t}
        locale={locale}
        s={{
          balance,
          needed: outlook.needed,
          sent: summary.sent,
          people: summary.people,
          credits: summary.credits,
          scheduled: scheduled.count,
          next: scheduled.next,
          failed: summary.failed,
          sinceLabel: period
            ? t('messages, since {date}', { date: `${monthName} 1` })
            : t('messages, all time'),
          periodLabel,
        }}
      />

      {outlook.short && balance !== null && (
        <CreditWarning
          at={outlook.short.at}
          needed={outlook.short.needed}
          balance={balance}
          t={t}
          locale={locale}
        />
      )}

      {!anyMessage ? (
        <Card className="flex flex-col items-center justify-center gap-3 py-12 text-center md:flex-1">
          <MessageSquareText className="h-8 w-8 text-gold-deep" />
          <p className="text-sm text-ink-muted">
            {t('No messages yet. Send an SMS notice to members, pre-members or the people of an event.')}
          </p>
          {newButton}
        </Card>
      ) : (
        <>
          <MessageFilterBar
            f={f}
            t={t}
            senders={senders}
            periods={periodOptions}
          />
          {rows.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-2 py-12 text-center md:flex-1">
              <p className="text-sm text-ink-muted">{t('No messages match these filters.')}</p>
              {!isCleared && (
                <Link
                  href={clearHref}
                  className="text-[12.5px] font-semibold text-brand hover:underline dark:text-gold-light"
                >
                  {t('Clear filters')}
                </Link>
              )}
            </Card>
          ) : (
            <>
              <MessageList
                rows={listRows}
                t={t}
                locale={locale}
                resume={(id) => <ResumeButton id={id} />}
              />
              <MessagePagination f={{ ...f, page: p.page }} p={p} total={list.total} t={t} locale={locale} />
            </>
          )}
        </>
      )}
    </div>
  );
}
