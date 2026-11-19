'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Square } from 'lucide-react';
import { secondaryBtn } from '@/components/events/button-classes';
import { useToast } from '@/hooks/use-toast';
import { useT } from '@/lib/i18n/client';
import { cn } from '@/lib/utils';
import { cancelBroadcast, resumeBroadcast } from '../actions';

/** Cancel (queued, sending, paused) and Resume (paused). */
export function BroadcastActions({
  id,
  canCancel,
  canResume,
}: {
  id: string;
  canCancel: boolean;
  canResume: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function run(action: (id: string) => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    const res = await action(id);
    setBusy(false);
    setConfirming(false);
    if (!res.ok)
      toast({ title: t('Error'), description: t(res.error ?? ''), variant: 'destructive' });
    router.refresh();
  }

  if (!canCancel && !canResume) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {canResume && (
        <button type="button" disabled={busy} onClick={() => run(resumeBroadcast)} className={secondaryBtn}>
          <Play className="h-3.5 w-3.5" /> {t('Resume')}
        </button>
      )}
      {canCancel &&
        (confirming ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(cancelBroadcast)}
              className={cn(secondaryBtn, 'border-status-absent/40 text-status-absent dark:text-status-absent')}
            >
              {t('Yes, stop sending')}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className={secondaryBtn}>
              {t('Keep sending')}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={cn(secondaryBtn, 'text-status-absent dark:text-status-absent')}
          >
            <Square className="h-3.5 w-3.5" /> {t('Cancel sending')}
          </button>
        ))}
    </div>
  );
}
