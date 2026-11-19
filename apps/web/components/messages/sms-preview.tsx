'use client';

import { TriangleAlert } from 'lucide-react';
import { useT } from '@/lib/i18n/client';
import { MAX_PARTS, signatureSuffix, splitSms } from '@/lib/sms/split';
import { cn } from '@/lib/utils';

/**
 * The SMS exactly as they will arrive: numbered messages with the
 * provider's signature, and each one's length against the limit. Uses the
 * same splitter as the server (lib/sms/split.ts).
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
  const split = splitSms(text, signature);
  if (!split.ok) {
    if (split.reason === 'empty')
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
        {split.reason === 'too_many_parts'
          ? t(
              'This needs {n} SMS; at most {max} are allowed. Shorten it, or post it on the notice board.',
              { n: split.needed, max: MAX_PARTS },
            )
          : t('A word is too long for one SMS: “{word}”.', {
              word: split.word.slice(0, 24),
            })}
      </p>
    );
  }
  return (
    <div className={cn('space-y-2', className)}>
      {split.parts.map((part, i) => (
        <div
          key={i}
          className="rounded-[14px] rounded-bl-[4px] border border-parchment-edge bg-parchment px-3.5 py-2.5 dark:bg-parchment-deep"
        >
          <p className="whitespace-pre-wrap break-words font-ethiopic text-[13px] leading-[1.5] text-ink">
            {part}
            <span className="text-ink-muted">{signatureSuffix(signature)}</span>
          </p>
          <div className="mt-1 text-right font-mono text-[10px] text-ink-faint">
            {split.lengths[i]}/{split.limit}
          </div>
        </div>
      ))}
      <p className="text-[11px] text-ink-muted">
        {split.parts.length === 1
          ? t('1 SMS per person')
          : t('{n} SMS per person, sent in order', { n: split.parts.length })}
        {' · '}
        {split.encoding === 'ucs2'
          ? t('Amharic: 70 characters per SMS')
          : t('Latin only: 160 characters per SMS')}
      </p>
    </div>
  );
}

/** Messages per person for a text, or 0 when it cannot be sent. */
export const partsFor = (text: string, signature: string) => {
  const s = splitSms(text, signature);
  return s.ok ? s.parts.length : 0;
};
