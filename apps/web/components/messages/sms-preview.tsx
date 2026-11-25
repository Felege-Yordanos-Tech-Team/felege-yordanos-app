'use client';

import { TriangleAlert } from 'lucide-react';
import { useT } from '@/lib/i18n/client';
import { composeSms, CREDITS_PER_PART, MAX_PARTS, signatureSuffix } from '@/lib/sms/split';
import { cn } from '@/lib/utils';

/**
 * The SMS exactly as it will arrive: one message with the provider's
 * signature, its length, SMS parts and credits per person. Uses the same
 * rule as the server (lib/sms/split.ts).
 */
export function SmsPreview({
  text,
  signature,
  className,
}: {
  text: string;
  signature: string;
  className?: string;
}) {
  const t = useT();
  const sms = composeSms(text, signature);
  if (!sms.ok) {
    if (sms.reason === 'empty')
      return (
        <p className={cn('text-[12px] text-ink-faint', className)}>
          {t('The preview appears as you type.')}
        </p>
      );
    return (
      <p
        role="alert"
        className={cn(
          'flex items-start gap-2 rounded-[10px] border border-status-absent/30 bg-status-absent-bg px-3 py-2.5 text-[12px] leading-snug text-status-absent',
          className,
        )}
      >
        <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {t(
          sms.excess === 1
            ? 'Too long: at most {max} SMS parts. Remove 1 character, or post it on the notice board.'
            : 'Too long: at most {max} SMS parts. Remove {n} characters, or post it on the notice board.',
          { n: sms.excess, max: MAX_PARTS },
        )}
      </p>
    );
  }
  return (
    <div className={cn('space-y-2', className)}>
      <div className="rounded-[14px] rounded-bl-[4px] border border-parchment-edge bg-parchment px-3.5 py-2.5 dark:bg-parchment-deep">
        <p className="whitespace-pre-wrap break-words font-ethiopic text-[13px] leading-[1.5] text-ink">
          {sms.text}
          <span className="text-ink-muted">{signatureSuffix(signature)}</span>
        </p>
      </div>
      <SmsCounter sms={sms} />
    </div>
  );
}

/**
 * "244 characters, 4 SMS parts, 4 credits per person (8 on Safaricom)" and
 * how it is charged.
 */
export function SmsCounter({
  sms,
  className,
}: {
  sms: { length: number; smsParts: number; encoding: 'gsm7' | 'ucs2' };
  className?: string;
}) {
  const t = useT();
  return (
    <div className={cn('space-y-0.5 text-[11px] text-ink-muted', className)}>
      <p className="font-medium text-ink">
        {t(
          sms.smsParts === 1
            ? '{chars} characters, 1 SMS part, {credits} credit per person ({safaricom} on Safaricom)'
            : '{chars} characters, {parts} SMS parts, {credits} credits per person ({safaricom} on Safaricom)',
          {
            chars: sms.length,
            parts: sms.smsParts,
            credits: sms.smsParts * CREDITS_PER_PART.ethio,
            safaricom: sms.smsParts * CREDITS_PER_PART.safaricom,
          },
        )}
      </p>
      <p>
        {t('Arrives as one message; charged per SMS part.')}
        {' · '}
        {sms.encoding === 'ucs2'
          ? t('Amharic: 70 characters for one SMS, 67 per part')
          : t('Latin only: 160 characters for one SMS, 153 per part')}
      </p>
    </div>
  );
}

/** SMS parts per person for a text, or 0 when it cannot be sent. */
export const partsFor = (text: string, signature: string) => {
  const s = composeSms(text, signature);
  return s.ok ? s.smsParts : 0;
};
