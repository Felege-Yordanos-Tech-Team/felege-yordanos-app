'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@felege-yordanos/db';
import { Check, X, ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

export function DonationsTable({ donations, profileMap, userId }: DonationsTableProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const filtered = filterStatus === 'all'
    ? donations
    : donations.filter((d) => d.status === filterStatus);

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

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
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

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Donation rejected' });
      setRejectingId(null);
      setRejectionReason('');
      router.refresh();
    }
  }

  async function openReceipt(path: string) {
    const supabase = createClient();
    const { data } = await supabase.storage.from('receipts').createSignedUrl(path, 300);
    if (data?.signedUrl) {
      setReceiptUrl(data.signedUrl);
    } else {
      toast({ title: 'Error', description: 'Could not load receipt', variant: 'destructive' });
    }
  }

  return (
    <>
      <div className="mt-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All donations</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Donor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="hidden sm:table-cell">Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No donations found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((d) => {
                const badge = statusBadge[d.status] ?? statusBadge.pending;
                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      <p className="font-medium">{profileMap[d.donor_id] ?? 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(d.created_at).toLocaleDateString()}
                      </p>
                    </TableCell>
                    <TableCell className="font-medium">
                      {d.amount.toLocaleString()} {d.currency}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {d.payment_method ? methodLabels[d.payment_method] ?? d.payment_method : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant} className={badge.className}>
                        {d.status}
                      </Badge>
                      {d.status === 'rejected' && d.rejection_reason && (
                        <p className="mt-1 text-xs text-destructive">
                          {d.rejection_reason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {d.receipt_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openReceipt(d.receipt_url!)}
                            title="View receipt"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        )}
                        {d.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              disabled={actionLoading === d.id}
                              onClick={() => handleVerify(d.id)}
                              title="Verify"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={actionLoading === d.id}
                              onClick={() => {
                                setRejectingId(d.id);
                                setRejectionReason('');
                              }}
                              title="Reject"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Rejection reason dialog */}
      <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Donation</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Reason for rejection</Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Receipt is unclear, amount doesn't match..."
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
              {actionLoading === rejectingId ? 'Rejecting...' : 'Reject Donation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt viewer dialog */}
      <Dialog open={!!receiptUrl} onOpenChange={(open) => !open && setReceiptUrl(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
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
