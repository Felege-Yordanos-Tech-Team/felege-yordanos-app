'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLocale, useT } from '@/lib/i18n/client';
import { cn } from '@/lib/utils';
import { closeEvent, reopenEvent } from '@/app/(admin)/admin/attendance/actions';
import { primaryBtn, secondaryBtn } from './event-ui';

/**
 * Close and Reopen buttons for an event, each with a confirm dialog. The
 * server actions check the permission again (canCloseEvent, canReopenEvent).
 */

function ConfirmDialog({
  open,
  onOpenChange,
  eyebrow,
  title,
  body,
  confirmLabel,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eyebrow: string;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  busy: boolean;
  onConfirm: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 rounded-[18px] border-parchment-edge bg-parchment p-6 shadow-[0_30px_70px_-24px_rgba(0,0,0,0.6)] sm:max-w-[420px] [&>button:last-child]:hidden">
        <div
          className={cn(
            'text-[11px] tracking-[0.06em] text-gold-deep',
            locale === 'am' ? 'font-display text-xs' : 'font-ethiopic',
          )}
        >
          {eyebrow}
        </div>
        <DialogTitle
          className={cn(
            'mt-0.5 leading-[1.1] text-brand-ink',
            locale === 'am'
              ? 'font-ethiopic text-xl font-semibold'
              : 'font-display text-2xl font-medium',
          )}
        >
          {title}
        </DialogTitle>
        <DialogDescription className="mt-2.5 text-[13px] leading-relaxed text-ink-muted">
          {body}
        </DialogDescription>
        <div className="mt-5 flex gap-2.5">
          <DialogClose
            type="button"
            className="flex-1 rounded-xl border border-parchment-edge bg-parchment-soft py-3 text-[13px] font-semibold text-brand transition-colors hover:bg-parchment-deep dark:text-gold-light"
          >
            {t('Cancel')}
          </DialogClose>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={cn(primaryBtn, 'flex-[1.4] px-5 py-3 text-[13px]')}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** "Close event": unmarked members become absent, then the summary shows. */
export function CloseEventButton({
  eventId,
  unmarked,
}: {
  eventId: string;
  /** Members on the check-in list without a mark (shown in the confirm). */
  unmarked: number;
}) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    const res = await closeEvent(eventId).catch(() => ({
      ok: false as const,
      error: 'Could not close the event. Please try again.',
    }));
    setBusy(false);
    if (!res.ok) {
      toast({
        title: t('Error'),
        description: t(res.error),
        variant: 'destructive',
      });
      return;
    }
    setOpen(false);
    toast({
      title: t('Event closed'),
      description: t('{n} marked absent.', { n: res.data.markedAbsent }),
    });
    router.push(`/admin/attendance/${eventId}`);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(secondaryBtn, 'text-status-absent dark:text-status-absent')}
      >
        <Lock className="h-[13px] w-[13px]" />
        {t('Close event')}
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        eyebrow={locale === 'am' ? 'Close event' : 'ዝግጅቱን መዝጋት'}
        title={t('Close this event?')}
        body={t(
          '{n} members who are not marked will be marked absent. Check-in stops.',
          { n: unmarked },
        )}
        confirmLabel={busy ? t('Closing…') : t('Close event')}
        busy={busy}
        onConfirm={confirm}
      />
    </>
  );
}

/** "Reopen" (admins): removes the automatic absents, check-in is back. */
export function ReopenEventButton({ eventId }: { eventId: string }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    const res = await reopenEvent(eventId).catch(() => ({
      ok: false as const,
      error: 'Could not reopen the event. Please try again.',
    }));
    setBusy(false);
    if (!res.ok) {
      toast({
        title: t('Error'),
        description: t(res.error),
        variant: 'destructive',
      });
      return;
    }
    setOpen(false);
    toast({ title: t('Event reopened') });
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={secondaryBtn}>
        <RotateCcw className="h-[13px] w-[13px]" />
        {t('Reopen')}
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        eyebrow={locale === 'am' ? 'Reopen event' : 'ዝግጅቱን እንደገና መክፈት'}
        title={t('Reopen this event?')}
        body={t(
          'Members marked absent when the event was closed go back to not marked. Marks made by volunteers stay.',
        )}
        confirmLabel={busy ? t('Reopening…') : t('Reopen')}
        busy={busy}
        onConfirm={confirm}
      />
    </>
  );
}
