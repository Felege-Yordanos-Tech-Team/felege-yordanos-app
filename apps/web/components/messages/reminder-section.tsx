'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BellRing, ExternalLink } from 'lucide-react';
import type { Audience } from '@felege-yordanos/db/schema';
import { previewAudience } from '@/app/(admin)/admin/messages/actions';
import { ToggleRow } from '@/components/forms/toggle-row';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { eatDate } from '@/lib/check-in-window';
import { formatYmd } from '@/lib/events';
import { useLocale, useT } from '@/lib/i18n/client';
import type { SelectionSummary } from '@/lib/sms/message-audience';
import {
  defaultReminderText,
  reminderDueAt,
  REMINDER_MAX_DAYS,
  type ReminderView,
} from '@/lib/sms/reminder-time';
import type { SmsStatus } from '@/lib/sms/transport';
import { cn } from '@/lib/utils';
import { SmsEstimate } from './sms-estimate';
import { partsFor, SmsPreview } from './sms-preview';

/** Reminder fields of the event form. */
export interface ReminderDraft {
  enabled: boolean;
  daysBefore: string;
  text: string;
  /** The text was edited (else it follows the event: default text). */
  custom: boolean;
  /** Something was changed (else the action leaves the reminder alone). */
  dirty: boolean;
}

export const emptyReminderDraft = (r: ReminderView | null): ReminderDraft => ({
  enabled: !!r && r.status !== 'cancelled',
  daysBefore: String(r?.daysBefore ?? 2),
  text: r?.text ?? '',
  custom: r?.text != null,
  dirty: false,
});

/** The event fields the reminder depends on (live from the form). */
interface DraftEvent {
  title: string;
  eventDate: string;
  startTime: string;
  audience: Audience;
}

const STATUS_LABEL: Record<ReminderView['status'], string> = {
  scheduled: 'Scheduled',
  sent: 'Sent',
  missed: 'Missed (time had passed)',
  cancelled: 'Cancelled',
  paused: 'Paused',
};

const labelCls =
  'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep';
const fieldCls =
  'h-auto rounded-[10px] border border-parchment-edge bg-parchment-soft px-[13px] py-2.5 text-[13px] text-ink placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-gold/30 dark:bg-parchment-deep';

/**
 * "SMS reminder" on the event form: on/off, days before (sent at 09:00
 * Ethiopian time), the text (default built from the event) with the live
 * preview and the credit estimate. Read-only for editors without the right
 * to send (`editable` false), and once the reminder has gone out.
 */
export function ReminderSection({
  editable,
  reminder,
  draft,
  onChange,
  event,
  status,
}: {
  editable: boolean;
  reminder: ReminderView | null;
  draft: ReminderDraft;
  onChange: (d: ReminderDraft) => void;
  event: DraftEvent;
  status: SmsStatus;
}) {
  const t = useT();
  const locale = useLocale();
  const [summary, setSummary] = useState<SelectionSummary | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const startTime = event.startTime || null;
  const defaultText =
    event.title.trim() && event.eventDate
      ? defaultReminderText({ title: event.title, eventDate: event.eventDate, startTime })
      : '';
  const text = draft.custom ? draft.text : defaultText;
  const days = Number(draft.daysBefore);
  const daysOk = Number.isInteger(days) && days >= 0 && days <= REMINDER_MAX_DAYS;
  const done = reminder?.status === 'sent' || reminder?.status === 'paused';
  const showEditor = editable && !done;

  // Recipient counts for the event's audience while the reminder is on.
  useEffect(() => {
    if (!showEditor || !draft.enabled) return;
    let live = true;
    previewAudience({ audience: event.audience, eventId: null }).then((res) => {
      if (live && res.ok) {
        setSummary(res.data.summary);
        setBalance(res.data.balance);
      }
    });
    return () => {
      live = false;
    };
  }, [showEditor, draft.enabled, event.audience]);

  if (!editable && !reminder) return null;

  const set = (patch: Partial<ReminderDraft>) => onChange({ ...draft, ...patch, dirty: true });

  const dueLine = (() => {
    if (!event.eventDate || !daysOk) return null;
    const due = reminderDueAt(event.eventDate, days);
    return t('Goes out {date} at 09:00 (ከጠዋቱ 3:00 ሰዓት).', {
      date: formatYmd(eatDate(due), locale, { weekday: 'short', month: 'short', day: 'numeric' }),
    });
  })();

  const statusLine = reminder && (
    <p className="flex flex-wrap items-center gap-x-2 text-[11.5px] text-ink-muted">
      <span className="font-semibold text-brand-ink">{t(STATUS_LABEL[reminder.status])}</span>
      {reminder.status !== 'cancelled' && (
        <span>
          · {t('{n} days before', { n: reminder.daysBefore })} ·{' '}
          {formatYmd(eatDate(new Date(reminder.dueAt)), locale, { month: 'short', day: 'numeric' })} 09:00
        </span>
      )}
      {reminder.broadcastId && (
        <Link
          href={`/admin/messages/${reminder.broadcastId}`}
          className="inline-flex items-center gap-1 font-medium text-gold-deep hover:text-brand"
        >
          {t('Open')} <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </p>
  );

  return (
    <div className="mt-4 rounded-[14px] border border-parchment-edge bg-parchment-soft/60 px-4 py-3.5 dark:bg-parchment-deep/40">
      <div className="mb-2.5 flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
        <BellRing className="h-3.5 w-3.5" /> {t('SMS reminder')}
      </div>

      {!showEditor ? (
        <div className="space-y-2">
          {statusLine}
          {reminder && reminder.status !== 'cancelled' && (
            <p className="rounded-[10px] bg-parchment px-3 py-2 font-ethiopic text-[12px] leading-[1.5] text-ink dark:bg-parchment-deep">
              {reminder.text ?? defaultText}
            </p>
          )}
          {!editable && (
            <p className="text-[11px] text-ink-faint">
              {t('Only people who may send messages can change the reminder.')}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {statusLine}
          {!status.configured && (
            <p className="text-[11.5px] text-status-late">
              {t('SMS is not configured. The reminder will pause until the SMSHub key is set.')}
            </p>
          )}
          <ToggleRow
            checked={draft.enabled}
            onChange={(enabled) => set({ enabled })}
            title={t('Send an SMS reminder')}
            hint={t('To everyone expected at the event with a phone number, once, at 09:00.')}
          />
          {draft.enabled && (
            <>
              <div className="grid grid-cols-[110px_1fr] items-end gap-3">
                <div>
                  <label htmlFor="ev-reminder-days" className={labelCls}>
                    {t('Days before')}
                  </label>
                  <Input
                    id="ev-reminder-days"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={REMINDER_MAX_DAYS}
                    step={1}
                    value={draft.daysBefore}
                    onChange={(e) => set({ daysBefore: e.target.value })}
                    className={cn(fieldCls, 'font-mono')}
                  />
                </div>
                <p className={cn('pb-2 text-[11.5px]', daysOk ? 'text-ink-muted' : 'text-status-absent')}>
                  {daysOk ? dueLine : t('Between 0 and {max} days.', { max: REMINDER_MAX_DAYS })}
                </p>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="ev-reminder-text" className={cn(labelCls, 'mb-0')}>
                    {t('Text')}
                  </label>
                  {draft.custom && (
                    <button
                      type="button"
                      onClick={() => set({ custom: false, text: '' })}
                      className="text-[11px] font-medium text-gold-deep hover:text-brand"
                    >
                      {t('Use the default text')}
                    </button>
                  )}
                </div>
                <Textarea
                  id="ev-reminder-text"
                  rows={3}
                  maxLength={1000}
                  value={text}
                  placeholder={t('Fill in the title and date first.')}
                  onChange={(e) => set({ text: e.target.value, custom: true })}
                  className={cn(fieldCls, 'min-h-0 font-ethiopic leading-[1.5]')}
                />
                {!draft.custom && (
                  <p className="mt-1 text-[11px] text-ink-muted">
                    {t('Default text: follows the event’s title, date and time.')}
                  </p>
                )}
              </div>
              <SmsPreview text={text} signature={status.signature} />
              <SmsEstimate
                summary={summary}
                parts={partsFor(text, status.signature)}
                balance={balance}
                hasBalance={status.hasBalance}
              />
              <p className="text-[11px] text-ink-muted">
                {t('The people expected on the day get it; today’s count is an estimate.')}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** What the form sends to the server for the reminder (undefined = unchanged). */
export function reminderPayload(
  draft: ReminderDraft,
  editable: boolean,
  defaultText: string,
) {
  if (!editable || !draft.dirty) return undefined;
  const text = draft.custom && draft.text.trim() !== defaultText.trim() ? draft.text : null;
  return {
    enabled: draft.enabled,
    daysBefore: Number(draft.daysBefore),
    text,
  };
}
