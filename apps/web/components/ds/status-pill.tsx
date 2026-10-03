import { cn } from '@/lib/utils';

const TONES = {
  pending: 'bg-status-late-bg text-status-late',
  late: 'bg-status-late-bg text-status-late',
  verified: 'bg-status-present-bg text-status-present',
  present: 'bg-status-present-bg text-status-present',
  rejected: 'bg-status-absent-bg text-status-absent',
  absent: 'bg-status-absent-bg text-status-absent',
  upcoming: 'bg-gold/[0.16] text-gold-deep',
  neutral: 'bg-parchment-deep text-ink-muted',
} as const;

export type StatusTone = keyof typeof TONES;

/** Dot + label pill for attendance and donation states. */
export function StatusPill({ tone, children, className }: { tone: StatusTone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex w-fit items-center gap-[5px] rounded-full px-[9px] py-[3px] text-[10.5px] font-semibold', TONES[tone], className)}>
      <span className="h-[5px] w-[5px] rounded-full bg-current" />
      {children}
    </span>
  );
}
