'use client';

import { cn } from '@/lib/utils';

/** On/off switch row: title, one-line hint, switch on the right. */
export function ToggleRow({
  checked,
  onChange,
  title,
  hint,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-center gap-4 rounded-[10px] border border-parchment-edge bg-parchment-soft px-4 py-3 text-left transition-colors hover:bg-parchment-deep/60 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-parchment-deep',
        className,
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-brand-ink">
          {title}
        </span>
        {hint && (
          <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-muted">
            {hint}
          </span>
        )}
      </span>
      <span
        aria-hidden
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-brand' : 'bg-parchment-edge-strong',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-cream shadow transition-[left]',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </span>
    </button>
  );
}
