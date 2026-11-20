import Link from 'next/link';
import Form from 'next/form';
import { Search } from 'lucide-react';
import type { Translate } from '@/lib/i18n/translate';
import {
  DEFAULT_MESSAGE_FILTERS,
  MESSAGE_STATUS_FILTERS,
  messagesHref,
  messagesQuery,
  type MessageFilters,
  type MessageStatusFilter,
} from '@/lib/sms/message-list';
import { cn } from '@/lib/utils';
import { AutoSubmitSelect } from './auto-submit-select';

const STATUS_LABEL: Record<MessageStatusFilter, string> = {
  all: 'All',
  scheduled: 'Scheduled',
  sending: 'Sending',
  done: 'Done',
  problem: 'Paused or failed',
};

const labelCls = 'text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep';
const fieldCls =
  'h-9 w-full rounded-[10px] border border-parchment-edge bg-parchment-soft px-2.5 text-[12.5px] text-ink focus:outline-none focus:ring-2 focus:ring-gold/30 dark:bg-parchment-deep';

/**
 * Status chips (links) and a GET form for search, sender (super admins) and
 * period. Every change goes back to page 1; the rows per page stay.
 */
export function MessageFilterBar({
  f,
  t,
  senders,
  periods,
}: {
  f: MessageFilters;
  t: Translate;
  /** Super admins only; null hides the sender filter. */
  senders: { id: string; name: string }[] | null;
  /** Labels of this month, last month and all time. */
  periods: { value: MessageFilters['period']; label: string }[];
}) {
  return (
    <div className="mb-4 space-y-3">
      <nav aria-label={t('Status')} className="-mx-[22px] overflow-x-auto px-[22px] md:mx-0 md:px-0">
        <ul className="flex w-max gap-1.5">
          {MESSAGE_STATUS_FILTERS.map((s) => {
            const active = f.status === s;
            return (
              <li key={s}>
                <Link
                  href={messagesHref(f, { status: s })}
                  aria-current={active ? 'page' : undefined}
                  scroll={false}
                  className={cn(
                    'flex items-center whitespace-nowrap rounded-full px-3 py-[6px] text-[11.5px] transition-colors',
                    active
                      ? 'bg-brand font-semibold text-cream'
                      : 'border border-parchment-edge bg-parchment-soft font-medium text-ink hover:bg-parchment-deep',
                  )}
                >
                  {t(STATUS_LABEL[s])}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Form
        key={messagesQuery(f)}
        action="/admin/messages"
        scroll={false}
        className={cn(
          'grid grid-cols-2 items-end gap-2.5',
          // The search takes the free space; the selects keep a natural width.
          senders
            ? 'lg:grid-cols-[minmax(0,1fr)_minmax(160px,240px)_minmax(150px,200px)]'
            : 'lg:grid-cols-[minmax(0,1fr)_minmax(150px,200px)]',
        )}
      >
        {f.status !== DEFAULT_MESSAGE_FILTERS.status && (
          <input type="hidden" name="status" value={f.status} />
        )}
        {f.per !== DEFAULT_MESSAGE_FILTERS.per && <input type="hidden" name="per" value={f.per} />}
        <div className="col-span-2 flex min-w-0 flex-col gap-1 lg:col-span-1">
          <label htmlFor="msg-q" className={labelCls}>
            {t('Search')}
          </label>
          <div className="flex gap-1.5">
            <span className="relative min-w-0 flex-1">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint"
              />
              <input
                id="msg-q"
                type="search"
                name="q"
                defaultValue={f.q}
                maxLength={100}
                placeholder={t('Words in the message…')}
                className={cn(fieldCls, 'pl-8 placeholder:text-ink-faint')}
              />
            </span>
            <button
              type="submit"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] border border-parchment-edge bg-parchment-soft px-3 text-[12px] font-semibold text-brand transition-colors hover:bg-parchment-deep dark:text-gold-light"
            >
              {t('Search')}
            </button>
          </div>
        </div>
        {senders && (
          <div className="flex min-w-0 flex-col gap-1">
            <label htmlFor="msg-sender" className={labelCls}>
              {t('Sender')}
            </label>
            <AutoSubmitSelect id="msg-sender" name="sender" defaultValue={f.sender} className={fieldCls}>
              <option value="all">{t('All senders')}</option>
              <option value="me">{t('Me')}</option>
              {senders.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </AutoSubmitSelect>
          </div>
        )}
        <div className={cn('flex min-w-0 flex-col gap-1', !senders && 'col-span-2 lg:col-span-1')}>
          <label htmlFor="msg-period" className={labelCls}>
            {t('Period')}
          </label>
          <AutoSubmitSelect id="msg-period" name="period" defaultValue={f.period} className={fieldCls}>
            {periods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
      </Form>
    </div>
  );
}
