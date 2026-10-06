'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  FileText,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { Card, Chip, Eyebrow, PageHead, StatusPill } from '@/components/ds';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { ActionResult } from '@/lib/action-result';
import { useLocale, useT } from '@/lib/i18n/client';
import { intlLocale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';
import type { DonationStatus, PaymentMethod } from '@felege-yordanos/db/schema';
import { rejectDonation, verifyDonation } from './actions';

export interface DonationRow {
  id: string;
  donorId: string;
  /** numeric column, returned as a string */
  amount: string;
  currency: string;
  paymentMethod: PaymentMethod | null;
  /** URL of the permission-checked receipt route, or null when no receipt */
  receiptHref: string | null;
  notes: string | null;
  status: DonationStatus;
  rejectionReason: string | null;
  /** ISO timestamp */
  createdAt: string;
}

export interface DonationTotals {
  pendingAmt: number;
  pendingCount: number;
  verifiedAmt: number;
  verifiedDonors: number;
}

interface DonationsTableProps {
  donations: DonationRow[];
  profileMap: Record<string, string>;
  totals: DonationTotals;
  currency: string;
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'Bank Transfer',
  telebirr: 'Telebirr',
  cash: 'Cash',
  other: 'Other',
};

const FILTERS: { value: 'all' | DonationStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
];

const QUEUE_COLS = 'grid-cols-[minmax(0,1.3fr)_110px_130px_80px_110px]';

/** Runs a server action, turning a network/server failure into an error result. */
async function callAction(
  action: () => Promise<ActionResult>,
): Promise<ActionResult> {
  try {
    return await action();
  } catch {
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
}

const isPdf = (href: string) => href.toLowerCase().includes('.pdf');

/** File name from a /api/receipts/<user>/<file> link. */
function receiptFileName(href: string) {
  const last = href.split('/').pop() ?? href;
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function DonationsTable({
  donations,
  profileMap,
  totals,
  currency,
}: DonationsTableProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | DonationStatus>(
    'pending',
  );
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const t = useT();
  const locale = useLocale();

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
  const fmtMoney = (v: string | number, cur: string) =>
    `${t(cur)} ${fmtNumber(v)}`;
  const methodLabel = (m: PaymentMethod | null) =>
    m ? t(METHOD_LABELS[m] ?? m) : '—';
  const donorName = (id: string) => profileMap[id] ?? t('Unknown');
  const donorCount = (n: number) =>
    `${fmtNumber(n)} ${n === 1 ? t('donor') : t('donors')}`;

  const counts = {
    all: donations.length,
    pending: donations.filter((d) => d.status === 'pending').length,
    verified: donations.filter((d) => d.status === 'verified').length,
    rejected: donations.filter((d) => d.status === 'rejected').length,
  };

  const filtered =
    filterStatus === 'all'
      ? donations
      : donations.filter((d) => d.status === filterStatus);

  // Desktop: selected donation for the receipt-review pane (defaults to first pending).
  const selected =
    donations.find((d) => d.id === selectedId) ??
    donations.find((d) => d.status === 'pending') ??
    donations[0] ??
    null;

  async function handleVerify(donationId: string) {
    setActionLoading(donationId);
    const res = await callAction(() => verifyDonation(donationId));
    setActionLoading(null);
    if (!res.ok)
      toast({
        title: t('Error'),
        description: t(res.error),
        variant: 'destructive',
      });
    else {
      toast({ title: t('Donation verified') });
      router.refresh();
    }
  }

  async function handleReject() {
    if (!rejectingId) return;
    setActionLoading(rejectingId);
    const id = rejectingId;
    const res = await callAction(() => rejectDonation(id, rejectionReason));
    setActionLoading(null);
    if (!res.ok)
      toast({
        title: t('Error'),
        description: t(res.error),
        variant: 'destructive',
      });
    else {
      toast({ title: t('Donation rejected') });
      setRejectingId(null);
      setRejectionReason('');
      router.refresh();
    }
  }

  function startReject(id: string) {
    setRejectingId(id);
    setRejectionReason('');
  }

  // Receipts are served by /api/receipts, which checks canViewReceipt.
  function openReceipt(href: string) {
    setReceiptUrl(href);
  }

  return (
    <>
      {/* ─── PHONE (< md) — totals, pills, cards ─── */}
      <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4 md:hidden">
        <Link
          href="/admin"
          className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep transition-colors hover:text-brand"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('Admin panel')}
        </Link>

        <PageHead
          en="Verify donations"
          am="መዋጮ ማረጋገጫ"
          sub="Review submitted donations against bank statements"
          className="mb-0"
        />

        {/* Totals strip */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-status-late/25 bg-status-late-bg px-3.5 py-3">
            <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-status-late">
              {t('Pending review')}
            </div>
            <div className="mt-1 font-mono text-[22px] font-medium leading-none tabular-nums text-status-late">
              {fmtNumber(totals.pendingAmt)}{' '}
              <span className="text-[11px] text-ink-muted">{t(currency)}</span>
            </div>
            <div className="mt-1 text-[10px] text-status-late/80">
              {donorCount(totals.pendingCount)}
            </div>
          </div>
          <div className="rounded-xl border border-status-present/25 bg-status-present-bg px-3.5 py-3">
            <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-status-present">
              {t('Verified')} · {t('this week')}
            </div>
            <div className="mt-1 font-mono text-[22px] font-medium leading-none tabular-nums text-status-present">
              {fmtNumber(totals.verifiedAmt)}{' '}
              <span className="text-[11px] text-ink-muted">{t(currency)}</span>
            </div>
            <div className="mt-1 text-[10px] text-status-present/80">
              {donorCount(totals.verifiedDonors)}
            </div>
          </div>
        </div>

        {/* Filter pills */}
        <div className="-mx-[22px] mb-3 mt-[18px] flex gap-1.5 overflow-x-auto px-[22px] pb-0.5">
          {FILTERS.map((f) => {
            const active = filterStatus === f.value;
            return (
              <Chip
                key={f.value}
                active={active}
                amharic={locale === 'am'}
                aria-pressed={active}
                onClick={() => setFilterStatus(f.value)}
                className="py-1.5 text-[11.5px]"
              >
                {t(f.label)}
                <span
                  className={cn(
                    'rounded px-1.5 py-px font-mono text-[9px] font-semibold',
                    active
                      ? 'bg-gold/25 text-gold'
                      : 'bg-ink/5 text-ink-muted dark:bg-gold/10',
                  )}
                >
                  {counts[f.value]}
                </span>
              </Chip>
            );
          })}
        </div>

        {/* Donation cards */}
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-parchment-edge py-8 text-center text-[13px] text-ink-muted">
            {t('No donations found')}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((d) =>
              d.status === 'pending' ? (
                <article
                  key={d.id}
                  className="rounded-xl border border-parchment-edge bg-parchment-soft px-3.5 pb-3 pt-3.5"
                >
                  <div className="mb-2.5 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-base font-medium leading-tight text-brand-ink">
                        {donorName(d.donorId)}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-ink-muted">
                        <span>{methodLabel(d.paymentMethod)}</span>
                        <span className="h-0.5 w-0.5 rounded-full bg-ink-faint" />
                        <span className="font-mono">
                          {fmtDate(d.createdAt)}
                        </span>
                      </div>
                      {d.notes && (
                        <p className="mt-1 truncate text-[11px] italic text-ink-muted">
                          {d.notes}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-lg font-medium leading-none tabular-nums text-brand dark:text-gold">
                        {fmtNumber(d.amount)}
                      </div>
                      <div className="mt-0.5 font-mono text-[9.5px] text-ink-muted">
                        {t(d.currency)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {d.receiptHref ? (
                      <button
                        type="button"
                        onClick={() =>
                          d.receiptHref && openReceipt(d.receiptHref)
                        }
                        className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-parchment-edge bg-parchment text-[11.5px] font-medium text-ink transition-colors hover:bg-parchment-deep"
                      >
                        <ImageIcon className="h-3 w-3 text-ink-muted" />
                        {t('View receipt')}
                      </button>
                    ) : (
                      <div className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-status-late-bg text-[10.5px] font-medium text-status-late">
                        <AlertCircle className="h-3 w-3" />
                        {t('No receipt')}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => startReject(d.id)}
                      disabled={actionLoading === d.id}
                      aria-label={t('Reject')}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-status-absent/25 bg-status-absent/[0.12] text-status-absent transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      <X className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerify(d.id)}
                      disabled={actionLoading === d.id}
                      aria-label={t('Verify')}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-status-present text-cream dark:text-parchment-deep shadow-[0_4px_12px_-4px_rgba(79,123,62,0.5)] transition-opacity hover:opacity-95 disabled:opacity-60"
                    >
                      <Check className="h-[18px] w-[18px]" strokeWidth={2.5} />
                    </button>
                  </div>
                </article>
              ) : (
                <article
                  key={d.id}
                  className="rounded-xl border border-parchment-edge bg-parchment-soft px-3.5 py-3 opacity-[0.85]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-[15px] font-medium leading-tight text-brand-ink">
                        {donorName(d.donorId)}
                      </div>
                      <div className="mt-px font-mono text-[10px] text-ink-muted">
                        {fmtNumber(d.amount)} {t(d.currency)} ·{' '}
                        {fmtDate(d.createdAt)}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {d.receiptHref && (
                        <button
                          type="button"
                          onClick={() =>
                            d.receiptHref && openReceipt(d.receiptHref)
                          }
                          className="rounded-md p-1 text-ink-muted hover:bg-parchment-deep hover:text-ink"
                          aria-label={t('View receipt')}
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <StatusPill tone={d.status}>{t(d.status)}</StatusPill>
                    </div>
                  </div>
                  {d.status === 'rejected' && d.rejectionReason && (
                    <div className="mt-2 rounded-md bg-status-absent-bg px-2.5 py-1.5 text-[10.5px] text-status-absent">
                      {d.rejectionReason}
                    </div>
                  )}
                </article>
              ),
            )}
          </div>
        )}
      </div>

      {/* ─── DESKTOP (md+) — queue table + receipt review ─── */}
      <div className="hidden px-7 py-7 md:block">
        <PageHead
          en="Verify donations"
          am="መዋጮ ማረጋገጫ"
          sub={t('{count} pending · {amount} awaiting review', {
            count: fmtNumber(counts.pending),
            amount: fmtMoney(totals.pendingAmt, currency),
          })}
        />

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Queue */}
          <Card className="p-[22px]">
            <div className="overflow-x-auto">
              <div className="min-w-[560px]">
                <div
                  className={cn(
                    'grid gap-3 border-b border-parchment-edge-strong px-1 pb-[9px]',
                    QUEUE_COLS,
                  )}
                >
                  {['Donor', 'Amount', 'Method', 'Date', 'Status'].map((h) => (
                    <span
                      key={h}
                      className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gold-deep"
                    >
                      {t(h)}
                    </span>
                  ))}
                </div>
                {donations.length === 0 ? (
                  <p className="py-10 text-center text-[13px] text-ink-muted">
                    {t('No donations yet')}
                  </p>
                ) : (
                  donations.map((d) => {
                    const active = d.id === selected?.id;
                    const name = donorName(d.donorId);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSelectedId(d.id)}
                        aria-pressed={active}
                        className={cn(
                          'grid w-full items-center gap-3 border-b border-parchment-edge py-3 text-left transition-colors',
                          QUEUE_COLS,
                          active
                            ? '-mx-1 w-[calc(100%+8px)] rounded-lg bg-gold/[0.08] px-2'
                            : 'px-1 hover:bg-parchment-deep/50',
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-[9px]">
                          <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-parchment-deep font-display text-[10.5px] font-bold text-brand dark:bg-gold/[0.14] dark:text-gold">
                            {initialsOf(name) || '?'}
                          </span>
                          <span
                            className={cn(
                              'truncate text-[12.5px] text-ink',
                              active ? 'font-semibold' : 'font-medium',
                            )}
                          >
                            {name}
                          </span>
                        </span>
                        <span className="font-mono text-xs text-ink">
                          {fmtMoney(d.amount, d.currency)}
                        </span>
                        <span className="text-[11.5px] text-ink-muted">
                          {methodLabel(d.paymentMethod)}
                        </span>
                        <span className="font-mono text-[10.5px] text-ink-muted">
                          {fmtDate(d.createdAt)}
                        </span>
                        <StatusPill tone={d.status}>{t(d.status)}</StatusPill>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </Card>

          {/* Receipt review */}
          <Card>
            <Eyebrow className="mb-2.5">{t('Receipt review')}</Eyebrow>
            {selected ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    selected.receiptHref && openReceipt(selected.receiptHref)
                  }
                  disabled={!selected.receiptHref}
                  aria-label={
                    selected.receiptHref ? t('View receipt') : t('No receipt')
                  }
                  className="relative flex h-[190px] w-full items-center justify-center overflow-hidden rounded-xl border border-parchment-edge bg-[repeating-linear-gradient(45deg,rgb(var(--fy-sunken)/0.55)_0px,rgb(var(--fy-sunken)/0.55)_10px,rgb(var(--fy-sunken))_10px,rgb(var(--fy-sunken))_20px)] disabled:cursor-default dark:bg-[repeating-linear-gradient(45deg,rgb(var(--fy-card))_0px,rgb(var(--fy-card))_10px,rgb(var(--fy-edge)/0.45)_10px,rgb(var(--fy-edge)/0.45)_20px)]"
                >
                  {selected.receiptHref && !isPdf(selected.receiptHref) && (
                    <img
                      key={selected.receiptHref}
                      src={selected.receiptHref}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <span className="relative inline-flex max-w-[90%] items-center gap-1.5 truncate rounded-md border border-parchment-edge bg-parchment-soft px-2.5 py-1 font-mono text-[10px] text-ink-muted">
                    {selected.receiptHref ? (
                      <>
                        {isPdf(selected.receiptHref) ? (
                          <FileText className="h-3 w-3 shrink-0" />
                        ) : (
                          <ImageIcon className="h-3 w-3 shrink-0" />
                        )}
                        <span className="truncate">
                          {t('receipt image')} ·{' '}
                          {receiptFileName(selected.receiptHref)}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 shrink-0 text-status-late" />
                        {t('No receipt')}
                      </>
                    )}
                  </span>
                </button>

                <div className="mt-3.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[13px] font-semibold text-ink">
                      {donorName(selected.donorId)}
                    </span>
                    <span className="shrink-0 font-mono text-[15px] text-brand dark:text-gold-light">
                      {fmtMoney(selected.amount, selected.currency)}
                    </span>
                  </div>
                  <div className="mt-[3px] text-[11px] text-ink-muted">
                    {methodLabel(selected.paymentMethod)} ·{' '}
                    <span className="font-mono">
                      {fmtDate(selected.createdAt)}
                    </span>
                  </div>
                  {selected.notes && (
                    <p className="mt-2 rounded-lg bg-parchment-deep/60 px-2.5 py-1.5 text-[11px] italic text-ink-muted">
                      {selected.notes}
                    </p>
                  )}
                </div>

                {selected.status === 'pending' ? (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleVerify(selected.id)}
                      disabled={actionLoading === selected.id}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-status-present py-2.5 text-xs font-semibold text-cream dark:text-parchment-deep shadow-[0_4px_12px_-4px_rgba(79,123,62,0.55)] transition-opacity hover:opacity-95 disabled:opacity-60"
                    >
                      <Check className="h-[13px] w-[13px]" />
                      {t('Verify')}
                    </button>
                    <button
                      type="button"
                      onClick={() => startReject(selected.id)}
                      disabled={actionLoading === selected.id}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-status-absent py-2.5 text-xs font-semibold text-status-absent transition-colors hover:bg-status-absent/[0.06] disabled:opacity-60"
                    >
                      <X className="h-[13px] w-[13px]" />
                      {t('Reject')}
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 rounded-[10px] border border-parchment-edge bg-parchment px-3 py-2.5 text-center">
                    <StatusPill tone={selected.status}>
                      {t(selected.status)}
                    </StatusPill>
                    {selected.status === 'rejected' &&
                      selected.rejectionReason && (
                        <p className="mt-1.5 text-[11px] text-status-absent">
                          {selected.rejectionReason}
                        </p>
                      )}
                  </div>
                )}
              </>
            ) : (
              <p className="py-10 text-center text-[13px] text-ink-muted">
                {t('Select a donation to review.')}
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Rejection reason dialog */}
      <Dialog
        open={!!rejectingId}
        onOpenChange={(open) => !open && setRejectingId(null)}
      >
        <DialogContent className="border-parchment-edge bg-parchment-soft">
          <DialogHeader>
            <DialogTitle
              className={cn(
                'text-xl text-brand-ink',
                locale === 'am'
                  ? 'font-ethiopic font-semibold'
                  : 'font-display font-medium',
              )}
            >
              {t('Reject donation')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <label
              htmlFor="rejection-reason"
              className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep"
            >
              {t('Reason')}
            </label>
            <textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t("e.g. Receipt is unclear, amount doesn't match…")}
              rows={3}
              maxLength={500}
              className="block w-full resize-y rounded-[10px] border border-parchment-edge bg-parchment px-3.5 py-2.5 text-[13px] text-ink outline-none placeholder:text-ink-faint focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/30 dark:bg-parchment-deep"
            />
          </div>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setRejectingId(null)}
              className="rounded-[10px] border border-parchment-edge bg-parchment-soft px-4 py-2 text-[12.5px] font-semibold text-brand transition-colors hover:bg-parchment-deep dark:text-gold"
            >
              {t('Cancel')}
            </button>
            <button
              type="button"
              disabled={actionLoading === rejectingId}
              onClick={handleReject}
              className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-status-absent px-4 py-2 text-[12.5px] font-semibold text-cream transition-opacity hover:opacity-95 disabled:opacity-60"
            >
              <X className="h-[13px] w-[13px]" />
              {actionLoading === rejectingId ? t('Rejecting…') : t('Reject')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt viewer */}
      <Dialog
        open={!!receiptUrl}
        onOpenChange={(open) => !open && setReceiptUrl(null)}
      >
        <DialogContent className="max-w-lg border-parchment-edge bg-parchment-soft">
          <DialogHeader>
            <DialogTitle
              className={cn(
                'text-xl text-brand-ink',
                locale === 'am'
                  ? 'font-ethiopic font-semibold'
                  : 'font-display font-medium',
              )}
            >
              {t('Receipt')}
            </DialogTitle>
          </DialogHeader>
          {receiptUrl &&
            (isPdf(receiptUrl) ? (
              <iframe
                src={receiptUrl}
                title={t('Receipt')}
                className="h-[500px] w-full rounded-lg border border-parchment-edge"
              />
            ) : (
              <img
                src={receiptUrl}
                alt={t('Receipt')}
                className="w-full rounded-lg border border-parchment-edge"
              />
            ))}
        </DialogContent>
      </Dialog>
    </>
  );
}
