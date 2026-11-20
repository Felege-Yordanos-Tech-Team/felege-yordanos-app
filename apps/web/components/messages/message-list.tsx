import Link from 'next/link';
import Form from 'next/form';
import { Bot, CalendarClock, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import type { BroadcastAudience, BroadcastStatus } from '@felege-yordanos/db/schema';
import { StatusPill, type StatusTone } from '@/components/ds';
import { secondaryBtn } from '@/components/events/button-classes';
import type { Locale } from '@/lib/i18n/config';
import type { Translate } from '@/lib/i18n/translate';
import {
  DEFAULT_MESSAGE_FILTERS,
  messagesHref,
  messagesQuery,
  pageList,
  PER_PAGE_OPTIONS,
  rowStatus,
  type MessageFilters,
  type Paging,
  type RowStatus,
} from '@/lib/sms/message-list';
import { cn } from '@/lib/utils';
import { AutoSubmitSelect } from './auto-submit-select';
import { formatSentAt, MESSAGE_AUDIENCE_LABEL } from './format';
import { fmtNumber } from './message-summary';

/** One row of the list, with what the user may do with it. */
export interface MessageListRow {
  id: string;
  text: string;
  status: BroadcastStatus;
  automatic: boolean;
  audience: BroadcastAudience;
  eventTitle: string | null;
  targetCount: number;
  senderName: string | null;
  /** Scheduled time for a scheduled one, else when it went out. */
  when: Date;
  sent: number;
  people: number;
  credits: number;
  /** Scheduled ones: today's estimate (null: unknown). */
  estimate: { recipients: number; credits: number } | null;
  canEdit: boolean;
  canResume: boolean;
}

const PILL: Record<RowStatus, { tone: StatusTone; label: string }> = {
  scheduled: { tone: 'upcoming', label: 'Scheduled' },
  sending: { tone: 'upcoming', label: 'Sending' },
  done: { tone: 'verified', label: 'Done' },
  paused: { tone: 'late', label: 'Paused' },
  missed: { tone: 'rejected', label: 'Not sent' },
  cancelled: { tone: 'neutral', label: 'Cancelled' },
};

function Pill({ status, t }: { status: BroadcastStatus; t: Translate }) {
  const p = PILL[rowStatus(status)];
  return (
    <StatusPill tone={p.tone} className="whitespace-nowrap">
      {t(p.label)}
    </StatusPill>
  );
}

const firstLine = (text: string) => text.split('\n').find((l) => l.trim())?.trim() ?? '';

function audienceLabel(r: MessageListRow, t: Translate) {
  if (r.audience === 'selected') return t('Selected people ({n})', { n: r.targetCount });
  if (r.audience === 'event' && r.eventTitle) return r.eventTitle;
  return t(MESSAGE_AUDIENCE_LABEL[r.audience]);
}

function sentPeople(r: MessageListRow, t: Translate, locale: Locale) {
  if (r.status === 'scheduled')
    return r.estimate ? t('est. {n}', { n: fmtNumber(r.estimate.recipients, locale) }) : '—';
  return `${fmtNumber(r.sent, locale)} / ${fmtNumber(r.people, locale)}`;
}

function credits(r: MessageListRow, t: Translate, locale: Locale) {
  if (r.status === 'scheduled')
    return r.estimate ? t('est. {n}', { n: fmtNumber(r.estimate.credits, locale) }) : '—';
  return fmtNumber(r.credits, locale);
}

function When({ r, locale }: { r: MessageListRow; locale: Locale }) {
  return (
    <span className="whitespace-nowrap font-mono text-[11px] text-ink-muted">
      {r.status === 'scheduled' && (
        <CalendarClock className="mr-1 inline h-3 w-3 align-[-2px]" aria-hidden />
      )}
      {formatSentAt(r.when, locale)}
    </span>
  );
}

const smallBtn = cn(secondaryBtn, 'px-2.5 py-1.5 text-[11.5px]');

function Actions({
  r,
  t,
  resume,
}: {
  r: MessageListRow;
  t: Translate;
  resume: (id: string) => React.ReactNode;
}) {
  if (!r.canEdit && !r.canResume) return null;
  return (
    <span className="relative z-10 flex gap-1.5">
      {r.canEdit && (
        <Link href={`/admin/messages/${r.id}/edit`} className={smallBtn}>
          <Pencil className="h-3 w-3" /> {t('Edit')}
        </Link>
      )}
      {r.canResume && resume(r.id)}
    </span>
  );
}

/** The link that opens a message; it covers the whole row or card. */
function OpenLink({ r, t, children }: { r: MessageListRow; t: Translate; children: React.ReactNode }) {
  return (
    <Link
      href={`/admin/messages/${r.id}`}
      aria-label={`${t('View')}: ${firstLine(r.text)}`}
      className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-[inherit] focus-visible:after:ring-2 focus-visible:after:ring-gold/50"
    >
      {children}
    </Link>
  );
}

/** Desktop table and phone cards. `resume` renders the Resume button. */
export function MessageList({
  rows,
  t,
  locale,
  resume,
}: {
  rows: MessageListRow[];
  t: Translate;
  locale: Locale;
  resume: (id: string) => React.ReactNode;
}) {
  const th = 'px-3 py-2.5 text-left text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gold-deep';
  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-2xl border border-parchment-edge bg-parchment-soft md:block">
        <table className="w-full table-fixed border-collapse text-[12px]">
          <caption className="sr-only">{t('Messages')}</caption>
          <colgroup>
            <col className="w-[120px]" />
            <col />
            <col className="w-[15%]" />
            <col className="w-[12%]" />
            <col className="w-[112px]" />
            <col className="w-[88px]" />
            <col className="w-[80px]" />
            <col className="w-[132px]" />
          </colgroup>
          <thead className="border-b border-parchment-edge-strong">
            <tr>
              <th scope="col" className={cn(th, 'pl-5')}>{t('Status')}</th>
              <th scope="col" className={th}>{t('Message')}</th>
              <th scope="col" className={th}>{t('Audience')}</th>
              <th scope="col" className={th}>{t('Sender')}</th>
              <th scope="col" className={th}>{t('When')}</th>
              <th scope="col" className={cn(th, 'text-right')}>{t('Sent / people')}</th>
              <th scope="col" className={cn(th, 'text-right')}>{t('Credits')}</th>
              <th scope="col" className={cn(th, 'pr-5 text-right')}>{t('Action')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="relative border-b border-parchment-edge transition-colors last:border-0 hover:bg-parchment-deep/60"
              >
                <td className="py-2.5 pl-5 pr-3">
                  <Pill status={r.status} t={t} />
                </td>
                <td className="min-w-0 px-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-1.5">
                    {r.automatic && (
                      <Bot className="h-3.5 w-3.5 shrink-0 text-pre-mid" aria-label={t('Automatic')} />
                    )}
                    <span className="truncate font-ethiopic text-[13px] text-ink">
                      {firstLine(r.text)}
                    </span>
                  </span>
                </td>
                <td className="truncate px-3 py-2.5 text-ink-muted">{audienceLabel(r, t)}</td>
                <td className="truncate px-3 py-2.5 text-ink-muted">{r.senderName ?? '—'}</td>
                <td className="px-3 py-2.5">
                  <When r={r} locale={locale} />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono tabular-nums text-ink">
                  {sentPeople(r, t, locale)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono tabular-nums text-ink">
                  {credits(r, t, locale)}
                </td>
                <td className="py-2.5 pl-3 pr-5">
                  <span className="flex items-center justify-end gap-1.5">
                    <Actions r={r} t={t} resume={resume} />
                    <OpenLink r={r} t={t}>
                      <span className="text-[11.5px] font-semibold text-brand hover:underline dark:text-gold-light">
                        {t('View')}
                      </span>
                    </OpenLink>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phone */}
      <ul className="flex flex-col gap-1.5 md:hidden">
        {rows.map((r) => (
          <li
            key={r.id}
            className="relative rounded-[12px] border border-parchment-edge bg-parchment-soft px-3.5 py-3 transition-colors hover:bg-parchment-deep/60"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Pill status={r.status} t={t} />
                {r.automatic && <Bot className="h-3.5 w-3.5 text-pre-mid" aria-label={t('Automatic')} />}
              </span>
              <When r={r} locale={locale} />
            </div>
            <p className="mt-1.5 truncate font-ethiopic text-[13.5px] text-ink">
              <OpenLink r={r} t={t}>
                {firstLine(r.text)}
              </OpenLink>
            </p>
            <div className="mt-1 flex items-center justify-between gap-3 text-[11px] text-ink-muted">
              <span className="min-w-0 truncate">
                {audienceLabel(r, t)}
                {r.senderName && ` · ${r.senderName}`}
              </span>
              <span className="shrink-0 font-mono tabular-nums">
                {sentPeople(r, t, locale)} · {credits(r, t, locale)} {t('credits')}
              </span>
            </div>
            {(r.canEdit || r.canResume) && (
              <div className="mt-2">
                <Actions r={r} t={t} resume={resume} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

/** Previous, page numbers, Next, and the rows-per-page choice. */
export function MessagePagination({
  f,
  p,
  total,
  t,
  locale,
}: {
  f: MessageFilters;
  p: Paging;
  total: number;
  t: Translate;
  locale: Locale;
}) {
  const prev = p.page > 1 ? messagesHref(f, { page: p.page - 1 }) : null;
  const next = p.page < p.pages ? messagesHref(f, { page: p.page + 1 }) : null;
  const navBtn = cn(secondaryBtn, 'px-2.5 py-1.5 text-[11.5px]');
  const off = cn(navBtn, 'pointer-events-none opacity-40');
  const Prev = (
    prev ? (
      <Link href={prev} className={navBtn}>
        <ChevronLeft className="h-3.5 w-3.5" /> {t('Previous')}
      </Link>
    ) : (
      <span aria-disabled="true" className={off}>
        <ChevronLeft className="h-3.5 w-3.5" /> {t('Previous')}
      </span>
    )
  );
  const Next = (
    next ? (
      <Link href={next} className={navBtn}>
        {t('Next')} <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    ) : (
      <span aria-disabled="true" className={off}>
        {t('Next')} <ChevronRight className="h-3.5 w-3.5" />
      </span>
    )
  );

  return (
    <nav aria-label={t('Pages')} className="mt-3">
      {/* Phone */}
      <div className="flex items-center justify-between gap-2 md:hidden">
        {Prev}
        <span className="text-center font-mono text-[11px] text-ink-muted">
          {t('Page {n} of {m} · {total} messages', {
            n: p.page,
            m: p.pages,
            total: fmtNumber(total, locale),
          })}
        </span>
        {Next}
      </div>

      {/* Desktop */}
      <div className="hidden items-center justify-between gap-4 md:flex">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] text-ink-muted">
            {t('Showing {a} to {b} of {n} messages', {
              a: fmtNumber(p.first, locale),
              b: fmtNumber(p.last, locale),
              n: fmtNumber(total, locale),
            })}
          </span>
          <Form key={messagesQuery(f)} action="/admin/messages" className="flex items-center gap-2">
            {f.status !== DEFAULT_MESSAGE_FILTERS.status && (
              <input type="hidden" name="status" value={f.status} />
            )}
            {f.sender !== DEFAULT_MESSAGE_FILTERS.sender && (
              <input type="hidden" name="sender" value={f.sender} />
            )}
            {f.period !== DEFAULT_MESSAGE_FILTERS.period && (
              <input type="hidden" name="period" value={f.period} />
            )}
            {f.q && <input type="hidden" name="q" value={f.q} />}
            <label htmlFor="per" className="text-[11px] text-ink-muted">
              {t('Rows per page')}
            </label>
            <AutoSubmitSelect
              id="per"
              name="per"
              defaultValue={String(f.per)}
              className="h-8 rounded-[8px] border border-parchment-edge bg-parchment-soft px-2 font-mono text-[11.5px] text-ink focus:outline-none focus:ring-2 focus:ring-gold/30 dark:bg-parchment-deep"
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </AutoSubmitSelect>
            <noscript>
              <button type="submit" className={navBtn}>
                {t('Apply')}
              </button>
            </noscript>
          </Form>
        </div>
        <div className="flex items-center gap-1">
          {Prev}
          <ol className="flex items-center gap-1">
            {pageList(p.page, p.pages).map((n, i) =>
              n === 'gap' ? (
                <li key={`gap-${i}`} aria-hidden className="px-1 font-mono text-[11px] text-ink-faint">
                  …
                </li>
              ) : (
                <li key={n}>
                  <Link
                    href={messagesHref(f, { page: n })}
                    aria-current={n === p.page ? 'page' : undefined}
                    aria-label={t('Page {n}', { n })}
                    className={cn(
                      'inline-flex h-8 min-w-8 items-center justify-center rounded-[8px] px-2 font-mono text-[11.5px] transition-colors',
                      n === p.page
                        ? 'bg-brand font-semibold text-cream'
                        : 'text-ink hover:bg-parchment-deep',
                    )}
                  >
                    {n}
                  </Link>
                </li>
              ),
            )}
          </ol>
          {Next}
        </div>
      </div>
    </nav>
  );
}
