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
  ethiopianClock,
  reminderDueAt,
  reminderRefusal,
  REMINDER_DEFAULT_TIME,
  REMINDER_MAX_DAYS,
  type ReminderView,
} from '@/lib/sms/reminder-time';
import { isClockTime } from '@/lib/sms/schedule';
import type { SmsStatus } from '@/lib/sms/transport';
import { cn } from '@/lib/utils';
import { SmsEstimate } from './sms-estimate';
import { MAX_SMS_INPUT } from '@/lib/sms/split';
import { partsFor, SmsPreview } from './sms-preview';

/** Reminder fields of the event form. */
export interface ReminderDraft {
  enabled: boolean;
  daysBefore: string;
  /** "HH:MM", EAT. */
  sendTime: string;
  text: string;
  /** The text was edited (else it follows the event: default text). */
  custom: boolean;
  /** Something was changed (else the action leaves the reminder alone). */
  dirty: boolean;
}

export const emptyReminderDraft = (r: ReminderView | null): ReminderDraft => ({
  enabled: !!r && r.status !== 'cancelled',
  daysBefore: String(r?.daysBefore ?? 2),
  sendTime: r?.sendTime ?? REMINDER_DEFAULT_TIME,
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

/**
 * Why the form cannot be saved because of the reminder, or null (same rule
 * as the server, lib/sms/reminders.ts): after the event start, or a time
 * that has passed or is less than 2 minutes away. The time of a stored
 * reminder the form did not touch is only checked when the event moves it.
 */
export function reminderDraftRefusal(
  draft: ReminderDraft,
  reminder: ReminderView | null,
  editable: boolean,
  event: Pick<DraftEvent, 'eventDate' | 'startTime'>,
  now: Date,
): string | null {
  if (!editable || !draft.enabled || !event.eventDate) return null;
  if (reminder?.status === 'sent' || reminder?.status === 'paused') return null;
  const days = Number(draft.daysBefore);
  if (!Number.isInteger(days) || days < 0 || days > REMINDER_MAX_DAYS) return null;
  if (!isClockTime(draft.sendTime)) return null;
  const due = reminderDueAt(event.eventDate, days, draft.sendTime);
  // Untouched: a missed reminder stays as it is; a scheduled one is only
  // checked for time when the event moves it.
  if (reminder && !draft.dirty && reminder.status === 'missed') return null;
  const checkTime =
    !reminder || draft.dirty || due.getTime() !== new Date(reminder.dueAt).getTime();
  return reminderRefusal(
    { eventDate: event.eventDate, startTime: event.startTime || null },
    days,
    draft.sendTime,
    checkTime ? now : null,
  );
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
 * "SMS reminder" on the event form: on/off, days before and the time
 * (Ethiopian time, default 09:00), the text (default built from the event) with the live
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
  const refusal = reminderDraftRefusal(draft, reminder, editable, event, new Date());

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
    if (!event.eventDate || !daysOk || !isClockTime(draft.sendTime)) return null;
    const due = reminderDueAt(event.eventDate, days, draft.sendTime);
    return t('Goes out {date} at {time} ({eth}).', {
      date: formatYmd(eatDate(due), locale, { weekday: 'short', month: 'short', day: 'numeric' }),
      time: draft.sendTime,
      eth: ethiopianClock(draft.sendTime),
    });
  })();

  const statusLine = reminder && (
    <p className="flex flex-wrap items-center gap-x-2 text-[11.5px] text-ink-muted">
      <span className="font-semibold text-brand-ink">{t(STATUS_LABEL[reminder.status])}</span>
      {reminder.status !== 'cancelled' && (
        <span>
          · {t('{n} days before', { n: reminder.daysBefore })} ·{' '}
          {formatYmd(eatDate(new Date(reminder.dueAt)), locale, { month: 'short', day: 'numeric' })}{' '}
          <span className="font-mono">{reminder.sendTime}</span> ({ethiopianClock(reminder.sendTime)})
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
            hint={t('To everyone expected at the event with a phone number, once, at the time you choose.')}
          />
          {draft.enabled && (
            <>
              <div className="grid grid-cols-[96px_120px] gap-3">
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
                <div>
                  <label htmlFor="ev-reminder-time" className={labelCls}>
                    {t('Time')}
                  </label>
                  <Input
                    id="ev-reminder-time"
                    type="time"
                    step={300}
                    required
                    value={draft.sendTime}
                    onChange={(e) => set({ sendTime: e.target.value.slice(0, 5) })}
                    className={cn(fieldCls, 'font-mono')}
                  />
                </div>
              </div>
              <p
                role={refusal || !daysOk ? 'alert' : undefined}
                className={cn(
                  'text-[11.5px]',
                  daysOk && !refusal ? 'text-ink-muted' : 'font-medium text-status-absent',
                )}
              >
                {!daysOk
                  ? t('Between 0 and {max} days.', { max: REMINDER_MAX_DAYS })
                  : refusal
                    ? t(refusal)
                    : dueLine}
              </p>
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
                  maxLength={MAX_SMS_INPUT}
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
    sendTime: draft.sendTime,
    text,
  };
}
