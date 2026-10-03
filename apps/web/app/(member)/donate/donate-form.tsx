'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Banknote,
  Building2,
  Heart,
  MoreHorizontal,
  Smartphone,
  Upload,
  UploadCloud,
} from 'lucide-react';
import {
  Card,
  Eyebrow,
  PageHead,
  SectionHeader,
  StatusPill,
} from '@/components/ds';
import { useToast } from '@/hooks/use-toast';
import { useBilingual, useLocale, useT } from '@/lib/i18n/client';
import { intlLocale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';
import type { DonationStatus, PaymentMethod } from '@felege-yordanos/db/schema';
import { createDonation } from './actions';

export interface DonationRow {
  id: string;
  /** numeric column, returned as a string */
  amount: string;
  currency: string;
  paymentMethod: PaymentMethod | null;
  status: DonationStatus;
  rejectionReason: string | null;
  /** ISO timestamp */
  createdAt: string;
  notes: string | null;
}

interface DonateFormProps {
  pastDonations: DonationRow[];
}

const QUICK_AMOUNTS = ['100', '250', '500', '1000'];

const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  Icon: typeof Banknote;
}[] = [
  { value: 'telebirr', label: 'Telebirr', Icon: Smartphone },
  { value: 'bank_transfer', label: 'Bank Transfer', Icon: Building2 },
  { value: 'cash', label: 'Cash', Icon: Banknote },
  { value: 'other', label: 'Other', Icon: MoreHorizontal },
];

const METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'Bank Transfer',
  telebirr: 'Telebirr',
  cash: 'Cash',
  other: 'Other',
};

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

/** Small uppercase field label. */
function FieldLabel({
  htmlFor,
  optional,
  children,
}: {
  htmlFor?: string;
  optional?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep"
    >
      {children}
      {optional && (
        <span className="font-normal normal-case tracking-normal text-ink-faint">
          {' '}
          · {optional}
        </span>
      )}
    </label>
  );
}

export function DonateForm({ pastDonations }: DonateFormProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const deskFileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const bi = useBilingual();

  const numberFmt = new Intl.NumberFormat(intlLocale(locale));
  const dateFmt = new Intl.DateTimeFormat(intlLocale(locale), {
    month: 'short',
    day: 'numeric',
  });
  const fmtNumber = (v: string | number) => numberFmt.format(Number(v));
  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : dateFmt.format(d);
  };
  const fmtMoney = (v: string | number, currency: string) =>
    `${t(currency)} ${fmtNumber(v)}`;
  const methodLabel = (m: PaymentMethod | null) =>
    m ? t(METHOD_LABELS[m] ?? m) : '—';

  // Giving-history summary: verified total for the current year.
  const currentYear = new Date().getFullYear();
  const verifiedTotal = pastDonations
    .filter(
      (d) =>
        d.status === 'verified' &&
        new Date(d.createdAt).getFullYear() === currentYear,
    )
    .reduce((sum, d) => sum + Number(d.amount), 0);
  const historyCurrency = pastDonations[0]?.currency ?? 'ETB';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append('amount', amount);
    if (method) formData.append('paymentMethod', method);
    if (notes) formData.append('notes', notes);

    if (file) {
      if (file.size > MAX_RECEIPT_BYTES) {
        toast({
          title: t('File too large'),
          description: t('Receipt must be under 5MB.'),
          variant: 'destructive',
        });
        setSubmitting(false);
        return;
      }

      formData.append('receipt', file);
    }

    let res: Awaited<ReturnType<typeof createDonation>>;
    try {
      res = await createDonation(formData);
    } catch {
      res = {
        ok: false,
        error: 'Could not submit your donation. Please try again.',
      };
    }

    setSubmitting(false);

    if (!res.ok) {
      toast({
        title: t('Error'),
        description: t(res.error),
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('Donation submitted'),
        description: t('Your donation is pending verification.'),
      });
      setAmount('');
      setMethod('');
      setNotes('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      if (deskFileRef.current) deskFileRef.current.value = '';
      router.refresh();
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }

  /** The Amharic accent is shown only in English mode. */
  const submitButton = (am: string, size: 'md' | 'lg', icon?: boolean) => (
    <button
      type="submit"
      disabled={submitting}
      className={cn(
        'sacred-gradient flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-gold/40 px-5 font-semibold tracking-[0.04em] text-cream shadow-[0_6px_16px_-6px_rgba(10,60,54,0.4),inset_0_1px_0_rgba(212,168,67,0.25)] transition-opacity hover:opacity-95 disabled:opacity-70',
        size === 'lg' ? 'py-[15px] text-sm' : 'py-3 text-[13px]',
      )}
    >
      {locale !== 'am' && (
        <>
          <span className="font-ethiopic text-xs opacity-85">{am}</span>
          <span className="h-3.5 w-px bg-gold/40" />
        </>
      )}
      {icon && <Heart className="h-3.5 w-3.5 text-gold" strokeWidth={2} />}
      <span>{submitting ? t('Submitting…') : t('Submit donation')}</span>
    </button>
  );

  const notesField = (id: string) => (
    <div>
      <FieldLabel htmlFor={id} optional={t('optional')}>
        {t('Notes')}
      </FieldLabel>
      <textarea
        id={id}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={t('For Easter offering')}
        rows={2}
        maxLength={500}
        className="block min-h-[48px] w-full resize-y rounded-[10px] border border-parchment-edge bg-parchment-soft px-3.5 py-2.5 text-[13px] text-ink outline-none placeholder:text-ink-faint focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/30 dark:bg-parchment-deep"
      />
    </div>
  );

  const fileInput = (ref: React.RefObject<HTMLInputElement | null>) => (
    <input
      ref={ref}
      type="file"
      accept="image/jpeg,image/png,application/pdf"
      className="hidden"
      aria-label={t('Receipt')}
      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
    />
  );

  return (
    <>
      {/* ─── PHONE (< md) ─── */}
      <div className="mx-auto max-w-md px-[22px] pb-6 pt-4 md:hidden">
        <SectionHeader en="Make a donation" am="መዋጮ" size="md" as="h1" />
        <p className="mt-1.5 text-[13px] text-ink-muted">
          {t('Submit your donation with a receipt — admins will verify it.')}
        </p>

        {/* Ornament rule */}
        <div className="my-4 flex items-center gap-2.5" aria-hidden>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-parchment-edge" />
          <span className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-gold opacity-40" />
            <span className="h-1 w-1 rounded-full bg-gold" />
            <span className="h-1 w-1 rounded-full bg-gold opacity-40" />
          </span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-parchment-edge" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Featured amount card */}
          <div className="relative overflow-hidden rounded-2xl border-[1.5px] border-parchment-edge bg-parchment-soft px-[18px] py-3.5 shadow-[0_0_0_4px_rgba(212,168,67,0.06)]">
            <label
              htmlFor="amount-phone"
              className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep"
            >
              {t('Amount')}
            </label>
            <div className="flex items-baseline gap-1.5">
              <input
                id="amount-phone"
                type="number"
                min="1"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                required
                className="w-full min-w-0 bg-transparent font-mono text-[36px] font-medium leading-none tabular-nums text-brand outline-none placeholder:text-ink-faint/60 dark:text-gold"
              />
              <span className="font-mono text-sm font-medium text-ink-muted">
                {t('ETB')}
              </span>
            </div>
            <div className="mt-2.5 flex gap-1.5">
              {QUICK_AMOUNTS.map((v) => {
                const active = amount === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(v)}
                    aria-pressed={active}
                    className={cn(
                      'flex-1 rounded-lg border py-1.5 font-mono text-[11px] font-semibold text-ink transition-colors',
                      active
                        ? 'border-gold bg-gold/[0.15]'
                        : 'border-parchment-edge bg-parchment hover:bg-parchment-deep',
                    )}
                  >
                    {fmtNumber(v)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment method */}
          <div>
            <FieldLabel>{t('Payment method')}</FieldLabel>
            <div
              className="grid grid-cols-2 gap-2"
              role="radiogroup"
              aria-label={t('Payment method')}
            >
              {PAYMENT_METHODS.map((m) => {
                const active = method === m.value;
                const { primary, secondary } = bi(m.label);
                return (
                  <button
                    key={m.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setMethod(m.value)}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-xl px-3.5 py-3 text-left transition-colors',
                      active
                        ? 'border-[1.5px] border-brand bg-brand/[0.08] dark:bg-brand/40'
                        : 'border border-parchment-edge bg-parchment-soft hover:bg-parchment-deep',
                    )}
                  >
                    <m.Icon
                      className={cn(
                        'h-4 w-4',
                        active ? 'text-brand dark:text-gold' : 'text-ink-muted',
                      )}
                      strokeWidth={1.75}
                    />
                    <span
                      className={cn(
                        'mt-1 text-xs font-semibold',
                        active ? 'text-brand-ink' : 'text-ink',
                        locale === 'am' && 'font-ethiopic',
                      )}
                    >
                      {primary}
                    </span>
                    <span
                      className={cn(
                        'text-[10px]',
                        active ? 'text-gold-deep' : 'text-ink-muted',
                        locale === 'am' ? 'font-body' : 'font-ethiopic',
                      )}
                    >
                      {secondary}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {notesField('notes-phone')}

          {/* Receipt upload */}
          <div>
            <FieldLabel optional={t('optional')}>{t('Receipt')}</FieldLabel>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-xl border border-dashed border-parchment-edge bg-gold/[0.05] px-4 py-3.5 text-left transition-colors hover:bg-gold/[0.08] dark:bg-gold/[0.04]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-gold/[0.18]">
                <UploadCloud className="h-5 w-5 text-gold" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-semibold text-ink">
                  {file ? file.name : t('Tap to upload receipt')}
                </span>
                <span className="mt-px block text-[10.5px] text-ink-muted">
                  {t('JPEG, PNG or PDF')} · {t('max 5MB')}
                </span>
              </span>
            </button>
            {fileInput(fileRef)}
          </div>

          <div className="pt-1">{submitButton('ላክ', 'lg')}</div>
        </form>

        {/* Past donations */}
        {pastDonations.length > 0 && (
          <section className="mt-[26px]">
            <SectionHeader en="Your donations" am="ያለፉ መዋጮዎች" />
            <div className="mt-2.5 space-y-2">
              {pastDonations.map((d) => (
                <div
                  key={d.id}
                  className="rounded-xl border border-parchment-edge bg-parchment-soft px-3.5 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-1 leading-none">
                        <span className="font-mono text-lg font-medium tabular-nums text-brand-ink">
                          {fmtNumber(d.amount)}
                        </span>
                        <span className="font-mono text-[11px] text-ink-muted">
                          {t(d.currency)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[10.5px] text-ink-muted">
                        <span>{methodLabel(d.paymentMethod)}</span>
                        <span className="h-0.5 w-0.5 rounded-full bg-ink-faint" />
                        <span className="font-mono">
                          {fmtDate(d.createdAt)}
                        </span>
                      </div>
                    </div>
                    <StatusPill tone={d.status}>{t(d.status)}</StatusPill>
                  </div>
                  {d.status === 'rejected' && d.rejectionReason && (
                    <div className="mt-2 rounded-lg bg-status-absent-bg px-2.5 py-1.5 text-[11px] text-status-absent">
                      {t('Reason')}: {d.rejectionReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ─── DESKTOP (md+) ─── */}
      <div className="hidden px-7 py-7 md:block">
        <PageHead
          en="Make a donation"
          am="መዋጮ"
          sub="Donations are reviewed and verified by the finance team."
        />

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
          {/* Form */}
          <Card className="p-6">
            <form onSubmit={handleSubmit}>
              <label htmlFor="amount-desk" className="mb-2.5 block">
                <Eyebrow>
                  {t('Amount')} · {t('ETB')}
                </Eyebrow>
              </label>
              <div className="flex items-baseline gap-2 rounded-xl border border-parchment-edge-strong bg-parchment px-4 py-3.5 shadow-[inset_0_1px_2px_rgba(10,60,54,0.05)] focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/25 dark:bg-parchment-deep dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                <span className="font-mono text-xs text-ink-faint">
                  {t('ETB')}
                </span>
                <input
                  id="amount-desk"
                  type="number"
                  min="1"
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full min-w-0 bg-transparent font-mono text-2xl leading-none tabular-nums text-ink outline-none placeholder:text-ink-faint/60"
                />
              </div>
              <div className="mt-2.5 flex gap-1.5">
                {QUICK_AMOUNTS.map((v) => {
                  const active = amount === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmount(v)}
                      aria-pressed={active}
                      className={cn(
                        'flex-1 rounded-full py-[7px] font-mono text-[11px] transition-colors',
                        active
                          ? 'bg-brand font-semibold text-cream'
                          : 'border border-parchment-edge bg-parchment-soft font-medium text-ink hover:bg-parchment-deep',
                      )}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>

              <Eyebrow className="mb-2 mt-[18px]">{t('Method')}</Eyebrow>
              <div
                className="flex flex-col gap-1.5"
                role="radiogroup"
                aria-label={t('Method')}
              >
                {PAYMENT_METHODS.map((m) => {
                  const active = method === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setMethod(m.value)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-left transition-colors',
                        active
                          ? 'border-gold/50 bg-gold/10'
                          : 'border-parchment-edge bg-parchment-soft hover:bg-parchment-deep',
                      )}
                    >
                      <m.Icon
                        className={cn(
                          'h-[15px] w-[15px] shrink-0',
                          active ? 'text-gold-deep' : 'text-ink-muted',
                        )}
                        strokeWidth={1.75}
                      />
                      <span
                        className={cn(
                          'flex-1 text-[12.5px] text-ink',
                          active ? 'font-semibold' : 'font-medium',
                          locale === 'am' && 'font-ethiopic',
                        )}
                      >
                        {t(m.label)}
                      </span>
                      <span
                        className={cn(
                          'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full',
                          active
                            ? 'bg-gold'
                            : 'border-[1.5px] border-parchment-edge-strong',
                        )}
                      >
                        {active && (
                          <span className="h-[5px] w-[5px] rounded-full bg-brand-deep" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Notes (GitHub issue #45) */}
              <div className="mt-[18px]">{notesField('notes-desk')}</div>

              <Eyebrow className="mb-2 mt-[18px]">
                {t('Receipt')}
                <span className="font-normal normal-case tracking-normal text-ink-faint">
                  {' '}
                  · {t('optional')}
                </span>
              </Eyebrow>
              <button
                type="button"
                onClick={() => deskFileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  'flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed px-4 py-5 text-center transition-colors',
                  dragging
                    ? 'border-gold bg-gold/[0.12]'
                    : 'border-parchment-edge-strong bg-gold/[0.06] hover:bg-gold/[0.09] dark:bg-gold/[0.04]',
                )}
              >
                <Upload
                  className="h-[18px] w-[18px] text-gold-deep"
                  strokeWidth={1.75}
                />
                <span className="text-xs text-ink-muted">
                  {file ? (
                    <span className="font-semibold text-ink">{file.name}</span>
                  ) : (
                    <>
                      {t('Drop receipt image, or')}{' '}
                      <span className="font-semibold text-gold-deep">
                        {t('browse')}
                      </span>
                    </>
                  )}
                </span>
                <span className="text-[10.5px] text-ink-faint">
                  {t('JPEG, PNG or PDF')} · {t('max 5MB')}
                </span>
              </button>
              {fileInput(deskFileRef)}

              <div className="mt-[18px]">{submitButton('መዋጮ', 'md', true)}</div>
            </form>
          </Card>

          {/* Giving history */}
          <Card className="p-6">
            <div className="mb-3.5 flex items-center justify-between gap-4">
              <SectionHeader en="Giving history" am="የመዋጮ ታሪክ" />
              <span className="whitespace-nowrap font-mono text-xs text-gold-deep">
                {fmtMoney(verifiedTotal, historyCurrency)}{' '}
                <span className="font-body text-[9.5px] text-ink-muted">
                  {t('verified')} · {currentYear}
                </span>
              </span>
            </div>

            {pastDonations.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="min-w-[440px]">
                  <div className="grid grid-cols-[90px_120px_minmax(0,1fr)_110px] gap-3 border-b border-parchment-edge-strong px-1 pb-[9px]">
                    {['Date', 'Amount', 'Method', 'Status'].map((h) => (
                      <span
                        key={h}
                        className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gold-deep"
                      >
                        {t(h)}
                      </span>
                    ))}
                  </div>
                  {pastDonations.map((d) => (
                    <div
                      key={d.id}
                      className="grid grid-cols-[90px_120px_minmax(0,1fr)_110px] items-center gap-3 border-b border-parchment-edge px-1 py-3"
                    >
                      <span className="font-mono text-[11px] text-ink-muted">
                        {fmtDate(d.createdAt)}
                      </span>
                      <span className="font-mono text-[12.5px] text-ink">
                        {fmtMoney(d.amount, d.currency)}
                      </span>
                      <span className="min-w-0 text-xs text-ink-muted">
                        {methodLabel(d.paymentMethod)}
                        {d.notes && (
                          <span className="mt-0.5 block truncate text-[10.5px] italic text-ink-faint">
                            {d.notes}
                          </span>
                        )}
                      </span>
                      <div>
                        <StatusPill tone={d.status}>{t(d.status)}</StatusPill>
                        {d.status === 'rejected' && d.rejectionReason && (
                          <div className="mt-[3px] text-[10px] text-status-absent">
                            {d.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-parchment-edge py-12 text-center text-[13px] text-ink-muted">
                {t('No donations yet. Your giving history will appear here.')}
              </div>
            )}

            <p className="mt-3.5 text-[11px] leading-normal text-ink-faint">
              {t(
                "Verification usually takes 1–2 days. You'll see the status update here once reviewed.",
              )}
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
