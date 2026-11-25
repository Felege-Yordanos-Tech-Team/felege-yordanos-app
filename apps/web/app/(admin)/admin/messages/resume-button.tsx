'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play } from 'lucide-react';
import { secondaryBtn } from '@/components/events/button-classes';
import { useToast } from '@/hooks/use-toast';
import { useT } from '@/lib/i18n/client';
import { cn } from '@/lib/utils';
import { resumeBroadcast } from './actions';

/** Resume a paused broadcast from the list (same action as the detail page). */
export function ResumeButton({ id, className }: { id: string; className?: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await resumeBroadcast(id);
        setBusy(false);
        if (!res.ok)
          toast({ title: t('Error'), description: t(res.error ?? ''), variant: 'destructive' });
        router.refresh();
      }}
      className={cn(secondaryBtn, 'px-2.5 py-1.5 text-[11.5px]', className)}
    >
      <Play className="h-3 w-3" /> {t('Resume')}
    </button>
  );
}
