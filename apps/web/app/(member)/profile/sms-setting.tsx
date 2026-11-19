'use client';

import { useState } from 'react';
import { ToggleRow } from '@/components/forms/toggle-row';
import { useToast } from '@/hooks/use-toast';
import { useT } from '@/lib/i18n/client';
import { setReceiveSms } from './actions';

/** "Receive SMS notices" (members.sms_opt_out / pre_members.sms_opt_out). */
export function SmsSetting({ receive }: { receive: boolean }) {
  const t = useT();
  const { toast } = useToast();
  const [value, setValue] = useState(receive);
  const [busy, setBusy] = useState(false);

  async function change(next: boolean) {
    setBusy(true);
    setValue(next);
    const res = await setReceiveSms(next);
    setBusy(false);
    if (!res.ok) {
      setValue(!next);
      toast({ title: t('Error'), description: t(res.error), variant: 'destructive' });
      return;
    }
    toast({
      title: t('Saved'),
      description: next
        ? t('You will receive SMS notices and event reminders.')
        : t('You will not receive SMS notices any more.'),
    });
  }

  return (
    <section className="mt-4">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
        {t('Notifications')}
      </div>
      <ToggleRow
        checked={value}
        onChange={change}
        disabled={busy}
        title={t('Receive SMS notices')}
        hint={t(
          'Event reminders and notices from the Sunday School, sent to the phone number on your record.',
        )}
      />
    </section>
  );
}
