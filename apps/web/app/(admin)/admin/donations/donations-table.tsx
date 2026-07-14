'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@felege-yordanos/db';
import { AlertCircle, Check, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface DonationRow {
  id: string;
  donor_id: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  receipt_url: string | null;
  notes: string | null;
  status: 'pending' | 'verified' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
}

interface DonationsTableProps {
  donations: DonationRow[];
  profileMap: Record<string, string>;
  userId: string;
}

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  telebirr: 'Telebirr',
  cash: 'Cash',
  other: 'Other',
};

const STATUS_STYLES: Record<
  DonationRow['status'],
  { bg: string; text: string; label: string }
> = {
  pending: { bg: 'bg-status-late-bg', text: 'text-status-late', label: 'Pending' },
  verified: { bg: 'bg-status-present-bg', text: 'text-status-present', label: 'Verified' },
  rejected: { bg: 'bg-status-absent-bg', text: 'text-status-absent', label: 'Rejected' },
};

const FILTERS: { value: 'all' | DonationRow['status']; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
];

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

export function DonationsTable({ donations, profileMap, userId }: DonationsTableProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | DonationRow['status']>('pending');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const counts = {
    all: donations.length,
    pending: donations.filter((d) => d.status === 'pending').length,
    verified: donations.filter((d) => d.status === 'verified').length,
    rejected: donations.filter((d) => d.status === 'rejected').length,
  };

  const filtered = filterStatus === 'all'
    ? donations
    : donations.filter((d) => d.status === filterStatus);

  // Desktop: selected donation for the receipt-review pane (defaults to first pending).
  const selected =
    donations.find((d) => d.id === selectedId) ??
    donations.find((d) => d.status === 'pending') ??
    donations[0] ??
    null;
  const pendingAmt = donations
    .filter((d) => d.status === 'pending')
    .reduce((a, b) => a + Number(b.amount), 0);

  async function handleVerify(donationId: string) {
    setActionLoading(donationId);
    const supabase = createClient();
    const { error } = await supabase
      .from('donations')
      .update({
        status: 'verified',
        verified_by: userId,
        verified_at: new Date().toISOString(),
      } as never)
      .eq('id', donationId);
    setActionLoading(null);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Donation verified' });
      router.refresh();
    }
  }

  async function handleReject() {
    if (!rejectingId) return;
    setActionLoading(rejectingId);
    const supabase = createClient();
    const { error } = await supabase
      .from('donations')
      .update({
        status: 'rejected',
        verified_by: userId,
        verified_at: new Date().toISOString(),
        rejection_reason: rejectionReason || null,
      } as never)
      .eq('id', rejectingId);
    setActionLoading(null);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Donation rejected' });
      setRejectingId(null);
      setRejectionReason('');
      router.refresh();
    }
  }

  async function openReceipt(path: string) {
    const supabase = createClient();
    const { data } = await supabase.storage.from('receipts').createSignedUrl(path, 300);
    if (data?.signedUrl) setReceiptUrl(data.signedUrl);
    else toast({ title: 'Error', description: 'Could not load receipt', variant: 'destructive' });
  }

  return (
    <>
    {/* ─── MOBILE (< md) — pills + cards ─── */}
    <div className="md:hidden">
      {/* Filter pills */}
      <div className="mb-3 mt-4 flex gap-1.5 overflow-x-auto pb-0.5">
        {FILTERS.map((f) => {
          const active = filterStatus === f.value;
          const count = counts[f.value];
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilterStatus(f.value)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] transition-colors ${
                active
                  ? 'border-transparent bg-burgundy font-semibold text-cream'
                  : 'border border-border bg-card font-medium text-foreground hover:bg-card/80'
              }`}
            >
              {f.label}
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold ${
                  active ? 'bg-gold/25 text-gold' : 'bg-background/60 text-muted-foreground'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Donation cards */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No donations found</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((d) =>
            d.status === 'pending' ? (
              <article
                key={d.id}
                className="rounded-xl border border-border bg-card px-3.5 py-3.5"
              >
                <div className="mb-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-base font-medium leading-tight text-burgundy-ink dark:text-cream">
                      {profileMap[d.donor_id] ?? 'Unknown'}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                      <span>
                        {d.payment_method
                          ? METHOD_LABELS[d.payment_method] ?? d.payment_method
                          : '—'}
                      </span>
                      <span className="h-0.5 w-0.5 rounded-full bg-ink-faint" />
                      <span className="font-mono">{formatShortDate(d.created_at)}</span>
                    </div>
                    {d.notes && (
                      <p className="mt-1 truncate text-[11px] italic text-muted-foreground">
                        {d.notes}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-display text-[22px] font-medium leading-none tabular-nums text-burgundy dark:text-gold">
                      {Number(d.amount).toLocaleString()}
                    </div>
                    <div className="mt-0.5 font-mono text-[9.5px] text-muted-foreground">
                      {d.currency}
                    </div>
                  </div>
                </div>

                {/* Action row */}
                <div className="flex items-center gap-1.5">
                  {d.receipt_url ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openReceipt(d.receipt_url!)}
                      className="h-9 flex-1 gap-1.5 rounded-lg border border-border bg-background text-[11.5px] font-medium hover:bg-card"
                    >
                      <ImageIcon className="h-3 w-3 text-muted-foreground" />
                      View receipt
                    </Button>
                  ) : (
                    <div className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-status-late-bg text-[10.5px] font-medium text-status-late">
                      <AlertCircle className="h-3 w-3" />
                      No receipt
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingId(d.id);
                      setRejectionReason('');
                    }}
                    disabled={actionLoading === d.id}
                    aria-label="Reject"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-status-absent/40 bg-status-absent/[0.15] text-status-absent transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    <X className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerify(d.id)}
                    disabled={actionLoading === d.id}
                    aria-label="Verify"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-status-present text-cream shadow-[0_4px_12px_-4px_rgba(79,123,62,0.5)] transition-opacity hover:opacity-95 disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              </article>
            ) : (
              <article
                key={d.id}
                className="rounded-xl border border-border bg-card px-3.5 py-3 opacity-90"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[15px] font-medium leading-tight text-burgundy-ink dark:text-cream">
                      {profileMap[d.donor_id] ?? 'Unknown'}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {Number(d.amount).toLocaleString()} {d.currency} · {formatShortDate(d.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {d.receipt_url && (
                      <button
                        type="button"
                        onClick={() => openReceipt(d.receipt_url!)}
                        className="rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                        aria-label="View receipt"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.06em] ${STATUS_STYLES[d.status].bg} ${STATUS_STYLES[d.status].text}`}
                    >
                      {STATUS_STYLES[d.status].label}
                    </span>
                  </div>
                </div>
                {d.status === 'rejected' && d.rejection_reason && (
                  <div className="mt-2 rounded-md bg-status-absent-bg px-2.5 py-1.5 text-[10.5px] text-status-absent">
                    {d.rejection_reason}
                  </div>
                )}
              </article>
            ),
          )}
        </div>
      )}
    </div>

    {/* ─── DESKTOP (md+) — queue table + receipt review ─── */}
    <div className="hidden md:block">
      <div className="mb-4">
        <div className="font-ethiopic text-xs text-gold-deep dark:text-gold">ስጦታ ማረጋገጫ</div>
        <h1 className="mt-0.5 font-display text-[30px] font-medium leading-[1.05] text-burgundy-ink dark:text-cream">
          Verify donations
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {counts.pending} pending · ETB {pendingAmt.toLocaleString()} awaiting review
        </p>
      </div>

      <div className="grid grid-cols-[1fr_340px] items-start gap-4">
        {/* Queue */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-fy-sm">
          <div className="grid grid-cols-[1.3fr_110px_130px_80px_110px] gap-3 border-b border-parchment-edge px-1 pb-2.5 dark:border-ink-muted/40">
            {['Donor', 'Amount', 'Method', 'Date', 'Status'].map((h, i) => (
              <span key={i} className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                {h}
              </span>
            ))}
          </div>
          {donations.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No donations</p>
          ) : (
            donations.map((d) => {
              const active = d.id === selected?.id;
              const initials = (profileMap[d.donor_id] ?? '?')
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedId(d.id)}
                  className={`grid w-full grid-cols-[1.3fr_110px_130px_80px_110px] items-center gap-3 border-b border-border px-1 py-3 text-left last:border-0 ${
                    active ? 'rounded-lg bg-gold/[0.08]' : 'hover:bg-card/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-parchment-deep font-display text-[10.5px] font-bold text-burgundy dark:bg-gold/[0.14] dark:text-gold">
                      {initials}
                    </div>
                    <span className={`text-[12.5px] ${active ? 'font-semibold' : 'font-medium'} text-foreground`}>
                      {profileMap[d.donor_id] ?? 'Unknown'}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-foreground">ETB {Number(d.amount).toLocaleString()}</span>
                  <span className="text-[11.5px] text-muted-foreground">
                    {d.payment_method ? METHOD_LABELS[d.payment_method] ?? d.payment_method : '—'}
                  </span>
                  <span className="font-mono text-[10.5px] text-muted-foreground">{formatShortDate(d.created_at)}</span>
                  <span
                    className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLES[d.status].bg} ${STATUS_STYLES[d.status].text}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {STATUS_STYLES[d.status].label.toLowerCase()}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Receipt review */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-fy-sm">
          <div className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep dark:text-gold">
            Receipt review
          </div>
          {selected ? (
            <>
              <button
                type="button"
                onClick={() => selected.receipt_url && openReceipt(selected.receipt_url)}
                disabled={!selected.receipt_url}
                className="flex h-[190px] w-full items-center justify-center overflow-hidden rounded-xl border border-border disabled:cursor-default"
                style={{
                  background:
                    'repeating-linear-gradient(45deg, #F3E9CF 0px, #F3E9CF 10px, #EFE2BE 10px, #EFE2BE 20px)',
                }}
              >
                <span className="rounded-md border border-border bg-card px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
                  {selected.receipt_url ? 'View receipt' : 'No receipt'}
                </span>
              </button>
              <div className="mt-3.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] font-semibold text-foreground">
                    {profileMap[selected.donor_id] ?? 'Unknown'}
                  </span>
                  <span className="font-mono text-[15px] text-burgundy dark:text-gold-light">
                    ETB {Number(selected.amount).toLocaleString()}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {selected.payment_method ? METHOD_LABELS[selected.payment_method] ?? selected.payment_method : '—'} ·{' '}
                  {formatShortDate(selected.created_at)}
                </div>
              </div>
              {selected.status === 'pending' ? (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleVerify(selected.id)}
                    disabled={actionLoading === selected.id}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-status-present py-2.5 text-xs font-semibold text-cream shadow-[0_4px_12px_-4px_rgba(79,123,62,0.5)] hover:opacity-95 disabled:opacity-60"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Verify
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingId(selected.id);
                      setRejectionReason('');
                    }}
                    disabled={actionLoading === selected.id}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-status-absent py-2.5 text-xs font-semibold text-status-absent hover:bg-status-absent/[0.06] disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>
              ) : (
                <div className="mt-4 rounded-[10px] border border-border bg-background py-2.5 text-center text-[11.5px] text-muted-foreground">
                  Already {STATUS_STYLES[selected.status].label.toLowerCase()}
                </div>
              )}
            </>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">Select a donation to review.</p>
          )}
        </div>
      </div>
    </div>

      {/* Rejection reason dialog */}
      <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Reject donation</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label
              htmlFor="rejection-reason"
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold"
            >
              Reason
            </Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Receipt is unclear, amount doesn't match…"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={actionLoading === rejectingId}
              onClick={handleReject}
            >
              {actionLoading === rejectingId ? 'Rejecting…' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt viewer */}
      <Dialog open={!!receiptUrl} onOpenChange={(open) => !open && setReceiptUrl(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Receipt</DialogTitle>
          </DialogHeader>
          {receiptUrl && (
            receiptUrl.includes('.pdf') ? (
              <iframe src={receiptUrl} className="h-[500px] w-full rounded" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={receiptUrl} alt="Receipt" className="w-full rounded" />
            )
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
