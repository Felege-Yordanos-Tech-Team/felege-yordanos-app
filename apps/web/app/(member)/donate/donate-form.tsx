'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@felege-yordanos/db';
import {
  Banknote,
  Building2,
  MoreHorizontal,
  Phone,
  UploadCloud,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface DonationRow {
  id: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  status: 'pending' | 'verified' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  notes: string | null;
}

interface DonateFormProps {
  userId: string;
  pastDonations: DonationRow[];
}

const QUICK_AMOUNTS = ['100', '250', '500', '1000'];

const PAYMENT_METHODS: {
  value: string;
  label: string;
  am: string;
  Icon: typeof Banknote;
}[] = [
  { value: 'bank_transfer', label: 'Bank Transfer', am: 'የባንክ ዝውውር', Icon: Building2 },
  { value: 'telebirr', label: 'Telebirr', am: 'ቴሌብር', Icon: Phone },
  { value: 'cash', label: 'Cash', am: 'ጥሬ ገንዘብ', Icon: Banknote },
  { value: 'other', label: 'Other', am: 'ሌላ', Icon: MoreHorizontal },
];

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  telebirr: 'Telebirr',
  cash: 'Cash',
  other: 'Other',
};

const STATUS_STYLES: Record<
  DonationRow['status'],
  { label: string; bg: string; text: string }
> = {
  pending: { label: 'Pending', bg: 'bg-status-late-bg', text: 'text-status-late' },
  verified: { label: 'Verified', bg: 'bg-status-present-bg', text: 'text-status-present' },
  rejected: { label: 'Rejected', bg: 'bg-status-absent-bg', text: 'text-status-absent' },
};

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function DonateForm({ userId, pastDonations }: DonateFormProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const supabase = createClient();
    let receiptUrl: string | null = null;

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Receipt must be under 5MB.',
          variant: 'destructive',
        });
        setSubmitting(false);
        return;
      }

      const ext = file.name.split('.').pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(path, file);

      if (uploadError) {
        toast({
          title: 'Upload failed',
          description: uploadError.message,
          variant: 'destructive',
        });
        setSubmitting(false);
        return;
      }

      receiptUrl = path;
    }

    const { error } = await supabase.from('donations').insert({
      donor_id: userId,
      amount: Number(amount),
      payment_method: method || null,
      receipt_url: receiptUrl,
      notes: notes || null,
    } as never);

    setSubmitting(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: 'Donation submitted',
        description: 'Your donation is pending verification.',
      });
      setAmount('');
      setMethod('');
      setNotes('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      router.refresh();
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Featured amount card */}
        <div
          className="relative overflow-hidden rounded-2xl border-[1.5px] border-border bg-card px-[18px] py-3.5 shadow-[0_0_0_4px_rgba(212,168,67,0.06)]"
        >
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep dark:text-gold">
            Amount
          </div>
          <div className="flex items-baseline gap-1.5">
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
              aria-label="Donation amount"
              className="w-full bg-transparent font-display text-[44px] font-medium leading-none tabular-nums text-burgundy outline-none placeholder:text-ink-faint/60 focus:outline-none dark:text-gold"
            />
            <span className="font-mono text-sm font-medium text-muted-foreground">
              ETB
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
                  className={`flex-1 rounded-lg py-1.5 font-mono text-[11px] font-semibold transition-colors ${
                    active
                      ? 'border border-gold bg-gold/[0.15] text-foreground'
                      : 'border border-border bg-background text-foreground hover:bg-card'
                  }`}
                >
                  {Number(v).toLocaleString()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment method */}
        <div>
          <Label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
            Payment method
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((m) => {
              const active = method === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={`flex flex-col items-start gap-1 rounded-xl px-3.5 py-3 text-left transition-colors ${
                    active
                      ? 'border-[1.5px] border-burgundy bg-burgundy/[0.08] dark:bg-burgundy/40'
                      : 'border border-border bg-card hover:bg-card/80'
                  }`}
                >
                  <m.Icon
                    className={`h-4 w-4 ${
                      active ? 'text-burgundy dark:text-gold' : 'text-muted-foreground'
                    }`}
                    strokeWidth={1.75}
                  />
                  <div
                    className={`mt-1 text-xs font-semibold ${
                      active ? 'text-burgundy-ink dark:text-cream' : 'text-foreground'
                    }`}
                  >
                    {m.label}
                  </div>
                  <div
                    className={`font-ethiopic text-[10px] ${
                      active ? 'text-gold-deep dark:text-gold' : 'text-muted-foreground'
                    }`}
                  >
                    {m.am}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bank details panel — only when bank transfer is selected */}
        {method === 'bank_transfer' && (
          <div
            className="rounded-xl border border-dashed border-gold bg-gold/[0.08] px-3.5 py-3 dark:bg-gold/[0.05]"
          >
            <div className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
              Send to · CBE
            </div>
            <div className="font-mono text-sm font-semibold tracking-[0.06em] text-burgundy-ink dark:text-cream">
              1000-4527-8891-0012
            </div>
            <div className="mt-0.5 text-[10.5px] text-muted-foreground">
              FELEGE YORDANOS SUNDAY SCHOOL
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <Label
            htmlFor="notes"
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold"
          >
            Notes <span className="font-normal text-ink-faint">· optional</span>
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="For Easter offering"
            rows={2}
            className="rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-gold/30 dark:bg-input"
          />
        </div>

        {/* Receipt upload */}
        <div>
          <Label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
            Receipt <span className="font-normal text-ink-faint">· optional</span>
          </Label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-gold/[0.05] px-4 py-3.5 text-left transition-colors hover:bg-gold/[0.08]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-gold/[0.18]">
              <UploadCloud className="h-5 w-5 text-gold" />
            </div>
            <div className="flex-1">
              <div className="text-[12.5px] font-semibold text-foreground">
                {file ? file.name : 'Tap to upload receipt'}
              </div>
              <div className="mt-0.5 text-[10.5px] text-muted-foreground">
                JPEG, PNG or PDF · max 5MB
              </div>
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={submitting}
          className="sacred-gradient mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-[15px] text-sm font-semibold tracking-wider text-cream shadow-[0_6px_16px_-6px_rgba(74,14,24,0.4),inset_0_1px_0_rgba(212,168,67,0.25)] transition-opacity hover:opacity-95 disabled:opacity-70"
          style={{ border: '1px solid rgba(212,168,67,0.4)' }}
        >
          <span className="font-ethiopic text-xs opacity-85">ላክ</span>
          <span className="h-3.5 w-px bg-gold/40" />
          <span>{submitting ? 'Submitting…' : 'Submit donation'}</span>
        </Button>
      </form>

      {/* Past donations */}
      {pastDonations.length > 0 && (
        <section className="mt-[26px]">
          <div className="mb-2.5">
            <div className="font-ethiopic text-[11px] font-medium tracking-[0.08em] text-gold-deep dark:text-gold">
              ያለፉ ስጦታዎች
            </div>
            <h2 className="font-display text-[22px] font-medium leading-[1.05] tracking-tight text-burgundy-ink dark:text-cream">
              Your donations
            </h2>
          </div>

          <div className="space-y-2">
            {pastDonations.map((d) => {
              const s = STATUS_STYLES[d.status] ?? STATUS_STYLES.pending;
              return (
                <div
                  key={d.id}
                  className="rounded-xl border border-border bg-card px-3.5 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1 font-display text-xl font-medium leading-none text-burgundy-ink dark:text-cream">
                        <span className="tabular-nums">
                          {d.amount.toLocaleString()}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {d.currency}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[10.5px] text-muted-foreground">
                        <span>
                          {d.payment_method
                            ? METHOD_LABELS[d.payment_method] ?? d.payment_method
                            : '—'}
                        </span>
                        <span className="h-0.5 w-0.5 rounded-full bg-ink-faint" />
                        <span className="font-mono">{formatShortDate(d.created_at)}</span>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${s.bg} ${s.text}`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {d.status === 'rejected' && d.rejection_reason && (
                    <div className="mt-2 rounded-lg bg-status-absent-bg px-2.5 py-1.5 text-[11px] text-status-absent">
                      Reason: {d.rejection_reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
