'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@felege-yordanos/db';
import { Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const statusBadge: Record<string, { variant: 'default' | 'secondary' | 'destructive'; className: string }> = {
  pending: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800' },
  verified: { variant: 'default', className: 'bg-green-600' },
  rejected: { variant: 'destructive', className: '' },
};

const methodLabels: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  telebirr: 'Telebirr',
  cash: 'Cash',
  other: 'Other',
};

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

    // Upload receipt if provided
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Receipt must be under 5MB.', variant: 'destructive' });
        setSubmitting(false);
        return;
      }

      const ext = file.name.split('.').pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(path, file);

      if (uploadError) {
        toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
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
      toast({ title: 'Donation submitted', description: 'Your donation is pending verification.' });
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
      <Card className="mt-4">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (ETB)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="telebirr">Telebirr</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Receipt (optional)</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {file ? file.name : 'Upload receipt'}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, or PDF. Max 5MB.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Donation'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {pastDonations.length > 0 && (
        <>
          <Separator className="my-6" />
          <h2 className="text-lg font-semibold">Your Donations</h2>
          <div className="mt-2 space-y-2">
            {pastDonations.map((d) => {
              const badge = statusBadge[d.status] ?? statusBadge.pending;
              return (
                <Card key={d.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {d.amount.toLocaleString()} {d.currency}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{d.payment_method ? methodLabels[d.payment_method] ?? d.payment_method : '—'}</span>
                          <span>{new Date(d.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge variant={badge.variant} className={badge.className}>
                        {d.status}
                      </Badge>
                    </div>
                    {d.status === 'rejected' && d.rejection_reason && (
                      <p className="mt-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        Reason: {d.rejection_reason}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
