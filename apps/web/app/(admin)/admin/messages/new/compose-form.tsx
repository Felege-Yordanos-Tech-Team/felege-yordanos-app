'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, Lock, Search, Send, Smartphone } from 'lucide-react';
import type { Audience } from '@felege-yordanos/db/schema';
import { Card } from '@/components/ds';
import { primaryBtn, secondaryBtn } from '@/components/events/button-classes';
import { MESSAGE_AUDIENCE_LABEL, SKIP_LABEL } from '@/components/messages/format';
import { SmsEstimate } from '@/components/messages/sms-estimate';
import { partsFor, SmsPreview } from '@/components/messages/sms-preview';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { eatDate, eatTime } from '@/lib/check-in-window';
import { formatYmd } from '@/lib/events';
import { useLocale, useT } from '@/lib/i18n/client';
import type { MessageAudience, SelectionSummary, SkipReason } from '@/lib/sms/message-audience';
import { ethiopianClock } from '@/lib/sms/reminder-time';
import { eatMoment, isClockTime, sendLaterRefusal } from '@/lib/sms/schedule';
import { estimateCredits, signatureSuffix } from '@/lib/sms/split';
import type { SmsStatus } from '@/lib/sms/transport';
import { cn } from '@/lib/utils';
import {
  createBroadcast,
  prepareBroadcast,
  previewAudience,
  sendTestToSelf,
  updateScheduledBroadcast,
  type PreparedBroadcast,
} from '../actions';

interface EventOption {
  id: string;
  title: string;
  eventDate: string;
  audience: Audience;
}

/** A scheduled broadcast being edited. */
export interface EditingBroadcast {
  id: string;
  audience: MessageAudience;
  eventId: string | null;
  text: string;
  /** EAT date and time it goes out. */
  date: string;
  time: string;
}

/** Default "later": the next full hour, Ethiopian time. */
function nextHour(): { date: string; time: string } {
  const at = new Date(Math.ceil((Date.now() + 60_000) / 3_600_000) * 3_600_000);
  return { date: eatDate(at), time: eatTime(at) };
}

/** "Fri, Nov 20 at 16:30 (ከቀኑ 10:30 ሰዓት)" for a moment, Ethiopian time. */
function whenLabel(at: Date, locale: 'am' | 'en') {
  const time = eatTime(at);
  return {
    date: formatYmd(eatDate(at), locale, { weekday: 'short', month: 'short', day: 'numeric' }),
    time,
    eth: ethiopianClock(time),
  };
}

const AUDIENCE_OPTIONS: MessageAudience[] = ['members', 'pre_members', 'everyone', 'event'];

const labelCls =
  'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep';
const fieldCls =
  'h-auto rounded-[10px] border border-parchment-edge bg-parchment-soft px-[13px] py-2.5 text-[13px] text-ink placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-gold/30 dark:bg-parchment-deep';

export function ComposeForm({
  status,
  events,
  ownPhoneMasked,
  today,
  editing = null,
}: {
  status: SmsStatus;
  events: EventOption[];
  ownPhoneMasked: string | null;
  today: string;
  /** Edit a scheduled broadcast (always "later"). */
  editing?: EditingBroadcast | null;
}) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  const [audience, setAudience] = useState<MessageAudience>(editing?.audience ?? 'members');
  const [eventId, setEventId] = useState<string | null>(editing?.eventId ?? null);
  const [eventQuery, setEventQuery] = useState('');
  const [text, setText] = useState(editing?.text ?? '');
  const [later, setLater] = useState(!!editing);
  const [sendDate, setSendDate] = useState(editing?.date ?? '');
  const [sendTime, setSendTime] = useState(editing?.time ?? '');
  const [summary, setSummary] = useState<SelectionSummary | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [prepared, setPrepared] = useState<PreparedBroadcast | null>(null);
  const [busy, setBusy] = useState<'test' | 'check' | 'send' | null>(null);

  const parts = partsFor(text, status.signature);
  const sendAt = later ? { date: sendDate, time: sendTime } : null;
  const target = { audience, eventId: audience === 'event' ? eventId : null, sendAt };
  const ready = audience !== 'event' || !!eventId;
  // Same rule as the server (2 minutes to 60 days ahead), shown live.
  const laterRefusal = !later
    ? null
    : !sendDate || !isClockTime(sendTime)
      ? 'Choose a date and time.'
      : sendLaterRefusal(eatMoment(sendDate, sendTime), new Date());
  const laterAt = later && !laterRefusal ? eatMoment(sendDate, sendTime) : null;

  function chooseLater(on: boolean) {
    setLater(on);
    if (on && !sendDate) {
      const d = nextHour();
      setSendDate(d.date);
      setSendTime(d.time);
    }
  }

  // Recipient counts and balance for the chosen audience.
  useEffect(() => {
    if (!ready) {
      setSummary(null);
      return;
    }
    let live = true;
    setLoadingPreview(true);
    previewAudience({ audience, eventId: audience === 'event' ? eventId : null }).then(
      (res) => {
        if (!live) return;
        setLoadingPreview(false);
        if (res.ok) {
          setSummary(res.data.summary);
          setBalance(res.data.balance);
        } else toast({ title: t('Error'), description: t(res.error), variant: 'destructive' });
      },
    );
    return () => {
      live = false;
    };
  }, [audience, eventId, ready]);

  const filteredEvents = useMemo(() => {
    const q = eventQuery.trim().toLowerCase();
    const list = q
      ? events.filter((e) => e.title.toLowerCase().includes(q) || e.eventDate.includes(q))
      : events;
    // Upcoming first (soonest first), then past (most recent first).
    const upcoming = list.filter((e) => e.eventDate >= today).sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    const past = list.filter((e) => e.eventDate < today);
    return [...upcoming, ...past].slice(0, 30);
  }, [events, eventQuery, today]);
  const chosenEvent = events.find((e) => e.id === eventId) ?? null;

  const fail = (error: string): void => {
    toast({ title: t('Error'), description: t(error), variant: 'destructive' });
  };

  async function handleTest() {
    setBusy('test');
    const res = await sendTestToSelf({ text });
    setBusy(null);
    if (!res.ok) return fail(res.error);
    toast({
      title: t('Test sent'),
      description:
        status.transport === 'console'
          ? t('Development: printed in the server log, not sent.')
          : t('{n} SMS to {phone}', { n: res.data.sent, phone: ownPhoneMasked ?? '' }),
    });
  }

  async function handleContinue() {
    setBusy('check');
    const res = await prepareBroadcast({ ...target, channel: 'sms', text });
    setBusy(null);
    if (!res.ok) return fail(res.error);
    setPrepared(res.data);
  }

  async function handleSend() {
    setBusy('send');
    const input = { ...target, channel: 'sms' as const, text };
    const res = editing
      ? await updateScheduledBroadcast(editing.id, input)
      : await createBroadcast(input);
    setBusy(null);
    if (!res.ok) return fail(res.error);
    setPrepared(null);
    if (later)
      toast({
        title: editing ? t('Changes saved') : t('Scheduled'),
        description: t('Recipients are worked out when it goes out.'),
      });
    else
      toast({ title: t('Sending started'), description: t('The messages go out in the background.') });
    router.push(`/admin/messages/${res.data.id}`);
    router.refresh();
  }

  // Later: today's count is only an estimate, nobody yet is fine.
  const canContinue =
    status.configured &&
    parts > 0 &&
    ready &&
    !!summary &&
    (later || summary.recipients > 0) &&
    !laterRefusal;
  const preparedAt = prepared?.scheduledAt ? whenLabel(new Date(prepared.scheduledAt), locale) : null;

  return (
    <>
      {!status.configured && (
        <p className="mb-4 rounded-[10px] border border-status-late/30 bg-status-late-bg px-3.5 py-2.5 text-[12px] text-status-late">
          {t('SMS is not configured. Messages cannot be sent until the SMSHub key is set.')}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-6">
        <Card className="space-y-4 p-4 md:p-5">
          {/* Channel */}
          <div>
            <div className={labelCls}>{t('Channel')}</div>
            <div role="radiogroup" aria-label={t('Channel')} className="grid grid-cols-2 gap-1 rounded-[10px] bg-parchment-deep p-[3px]">
              <button
                type="button"
                role="radio"
                aria-checked
                className="flex items-center justify-center gap-1.5 rounded-lg bg-parchment-soft px-2 py-2 text-[12px] font-semibold text-brand-ink shadow-[0_1px_2px_rgba(10,60,54,0.08)]"
              >
                <Smartphone className="h-3.5 w-3.5" /> SMS
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={false}
                disabled
                title={t('Coming soon')}
                className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[12px] font-medium text-ink-faint"
              >
                <Lock className="h-3 w-3" /> Telegram
                <span className="rounded-full bg-parchment-soft/70 px-1.5 text-[9.5px] uppercase tracking-[0.06em]">
                  {t('Coming soon')}
                </span>
              </button>
            </div>
          </div>

          {/* Audience */}
          <div>
            <div className={labelCls}>{t('Who gets it?')}</div>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('Who gets it?')}>
              {AUDIENCE_OPTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  aria-checked={audience === a}
                  onClick={() => setAudience(a)}
                  className={cn(
                    'rounded-full px-3 py-[6px] text-[12px] transition-colors',
                    audience === a
                      ? 'bg-brand font-semibold text-cream'
                      : 'border border-parchment-edge bg-parchment-soft font-medium text-ink hover:bg-parchment-deep',
                  )}
                >
                  {t(MESSAGE_AUDIENCE_LABEL[a])}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-ink-muted">
              {t('Children (ህጻናት መደበኛ) do not get SMS.')}
            </p>
            {audience === 'event' && (
              <div className="mt-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 z-[1] h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
                  <Input
                    type="search"
                    value={eventQuery}
                    onChange={(e) => setEventQuery(e.target.value)}
                    placeholder={t('Search events…')}
                    aria-label={t('Search events…')}
                    className={cn(fieldCls, 'pl-[34px]')}
                  />
                </div>
                <ul className="mt-2 max-h-56 overflow-y-auto rounded-[10px] border border-parchment-edge" role="listbox" aria-label={t('Events')}>
                  {filteredEvents.length === 0 && (
                    <li className="px-3 py-3 text-[12px] text-ink-muted">{t('No events')}</li>
                  )}
                  {filteredEvents.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={eventId === e.id}
                        onClick={() => setEventId(e.id)}
                        className={cn(
                          'flex w-full items-center gap-3 border-b border-parchment-edge px-3 py-2 text-left last:border-b-0',
                          eventId === e.id ? 'bg-brand/10 dark:bg-gold/10' : 'hover:bg-parchment-deep/60',
                        )}
                      >
                        <span className="w-[70px] shrink-0 font-mono text-[11px] text-ink-muted">
                          {formatYmd(e.eventDate, locale)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">{e.title}</span>
                        {e.eventDate < today && (
                          <span className="text-[10px] text-ink-faint">{t('Past')}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
                {chosenEvent && (
                  <p className="mt-1.5 text-[11px] text-ink-muted">
                    {t('People expected at {title}, same as its check-in list.', { title: chosenEvent.title })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <label htmlFor="sms-text" className={labelCls}>
              {t('Message')}
            </label>
            <Textarea
              id="sms-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              maxLength={1000}
              placeholder={t('Start with ፈለገ ዮርዳኖስ so people know who it is from.')}
              className={cn(fieldCls, 'min-h-[140px] font-ethiopic leading-[1.55]')}
            />
            <p className="mt-1.5 text-[11px] leading-snug text-ink-muted">
              {t('Line breaks become spaces. Never ask people to reply with a code: the provider blocks it.')}
            </p>
          </div>

          {/* When */}
          <div>
            <div className={labelCls}>{t('When?')}</div>
            {!editing && (
              <div role="radiogroup" aria-label={t('When?')} className="grid grid-cols-2 gap-1 rounded-[10px] bg-parchment-deep p-[3px]">
                {([false, true] as const).map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    role="radio"
                    aria-checked={later === v}
                    onClick={() => chooseLater(v)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[12px] transition-colors',
                      later === v
                        ? 'bg-parchment-soft font-semibold text-brand-ink shadow-[0_1px_2px_rgba(10,60,54,0.08)]'
                        : 'font-medium text-ink-muted hover:text-ink',
                    )}
                  >
                    {v ? <CalendarClock className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                    {v ? t('Later') : t('Now')}
                  </button>
                ))}
              </div>
            )}
            {later && (
              <div className={cn('space-y-1.5', !editing && 'mt-2.5')}>
                <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-2">
                  <div>
                    <label htmlFor="sms-send-date" className="sr-only">
                      {t('Date')}
                    </label>
                    <Input
                      id="sms-send-date"
                      type="date"
                      min={today}
                      value={sendDate}
                      onChange={(e) => setSendDate(e.target.value)}
                      className={cn(fieldCls, 'font-mono')}
                    />
                  </div>
                  <div>
                    <label htmlFor="sms-send-time" className="sr-only">
                      {t('Time')}
                    </label>
                    <Input
                      id="sms-send-time"
                      type="time"
                      step={300}
                      value={sendTime}
                      onChange={(e) => setSendTime(e.target.value.slice(0, 5))}
                      className={cn(fieldCls, 'font-mono')}
                    />
                  </div>
                </div>
                <p
                  role={laterRefusal ? 'alert' : undefined}
                  className={cn(
                    'text-[11.5px]',
                    laterRefusal ? 'font-medium text-status-absent' : 'text-ink-muted',
                  )}
                >
                  {laterRefusal
                    ? t(laterRefusal)
                    : laterAt && t('Goes out {date} at {time} ({eth}).', whenLabel(laterAt, locale))}
                </p>
                <p className="text-[11px] text-ink-muted">
                  {t('Ethiopian time. Recipients are worked out when it goes out.')}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleTest}
              disabled={!status.configured || !ownPhoneMasked || parts === 0 || busy !== null}
              className={cn(secondaryBtn, 'justify-center')}
              title={ownPhoneMasked ? undefined : t('Your profile has no phone number for SMS.')}
            >
              <Smartphone className="h-3.5 w-3.5" />
              {busy === 'test' ? t('Sending…') : t('Send a test to myself')}
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue || busy !== null}
              className={cn(primaryBtn, 'flex-1 px-4 py-2.5 text-[12.5px]')}
            >
              <Send className="h-3.5 w-3.5" />
              {busy === 'check' ? t('Checking…') : t('Continue')}
            </button>
          </div>
          <p className="text-[11px] text-ink-muted">
            {ownPhoneMasked
              ? t('The test goes to your number {phone}.', { phone: ownPhoneMasked })
              : t('Test to yourself needs a phone number on your linked member or pre-member record.')}
          </p>
        </Card>

        <div className="space-y-4">
          <section aria-label={t('Preview')}>
            <div className={labelCls}>{t('Preview')}</div>
            <SmsPreview text={text} signature={status.signature} />
          </section>
          <SmsEstimate
            summary={ready ? summary : null}
            parts={parts}
            balance={balance}
            hasBalance={status.hasBalance}
            loading={loadingPreview}
          />
        </div>
      </div>

      <Dialog open={!!prepared} onOpenChange={(o) => !o && setPrepared(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[20px] border-parchment-edge bg-parchment sm:max-w-[520px]">
          <DialogTitle className="font-display text-2xl font-medium text-brand-ink">
            {preparedAt ? t('Schedule this SMS?') : t('Send this SMS?')}
          </DialogTitle>
          <DialogDescription className="text-[12.5px] text-ink-muted">
            {t('Checked by SMSHub. Nothing has been sent yet.')}
          </DialogDescription>
          {prepared && (
            <div className="space-y-3">
              {preparedAt && (
                <p className="flex items-start gap-2 rounded-[12px] border border-gold/40 bg-gold/10 px-3 py-2 text-[12px] text-ink dark:bg-gold/[0.06]">
                  <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-deep" />
                  <span>
                    <span className="font-semibold">{t('Goes out {date} at {time} ({eth}).', preparedAt)}</span>{' '}
                    {t('Counted as of today; people are counted again when it goes out.')}
                  </span>
                </p>
              )}
              <dl className="grid grid-cols-3 gap-2 rounded-[12px] border border-parchment-edge bg-parchment-soft p-3 text-center dark:bg-parchment-deep">
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.12em] text-gold-deep">{t('Recipients')}</dt>
                  <dd className="font-mono text-lg font-semibold text-brand-ink">{prepared.summary.recipients}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.12em] text-gold-deep">{t('SMS per person')}</dt>
                  <dd className="font-mono text-lg font-semibold text-brand-ink">{prepared.parts.length}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.12em] text-gold-deep">{t('Credits')}</dt>
                  <dd className="font-mono text-lg font-semibold text-brand-ink">
                    {estimateCredits(prepared.parts.length, prepared.summary)}
                  </dd>
                </div>
              </dl>
              {(Object.entries(prepared.summary.skipped) as [SkipReason, number][]).some(
                ([, n]) => n > 0,
              ) && (
                <div className="text-[11.5px] text-ink-muted">
                  <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-deep">
                    {t('Skipped')}
                  </div>
                  <ul className="space-y-0.5">
                    {(Object.entries(prepared.summary.skipped) as [SkipReason, number][])
                      .filter(([, n]) => n > 0)
                      .map(([reason, n]) => (
                        <li key={reason} className="flex justify-between gap-3">
                          <span>{t(SKIP_LABEL[reason])}</span>
                          <span className="font-mono">{n}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              {prepared.balance !== null && (
                <p className="text-[11.5px] text-ink-muted">
                  {t('Balance: {n} credits', { n: prepared.balance })}
                </p>
              )}
              <ol className="space-y-2">
                {prepared.parts.map((p, i) => (
                  <li key={i} className="rounded-[12px] border border-parchment-edge bg-parchment-soft px-3 py-2 font-ethiopic text-[12.5px] leading-[1.5] whitespace-pre-wrap text-ink dark:bg-parchment-deep">
                    {p}
                    <span className="text-ink-muted">{signatureSuffix(prepared.signature)}</span>
                  </li>
                ))}
              </ol>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setPrepared(null)} className={cn(secondaryBtn, 'flex-1 justify-center')}>
                  {t('Cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={busy !== null}
                  className={cn(primaryBtn, 'flex-[2] px-4 py-2.5 text-[12.5px]')}
                >
                  {busy === 'send'
                    ? t('Starting…')
                    : preparedAt
                      ? editing
                        ? t('Save changes')
                        : t('Schedule the message')
                      : t('Send to {n} people', { n: prepared.summary.recipients })}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
