import { cn } from '@/lib/utils';

/** Raised parchment card. */
export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-parchment-edge bg-parchment-soft p-5 shadow-[0_1px_0_rgba(10,60,54,0.04),0_4px_14px_-8px_rgba(10,60,54,0.12)] dark:shadow-[0_4px_14px_-8px_rgba(0,0,0,0.4)]',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Small uppercase gold label. */
export function Eyebrow({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('shrink-0 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep', className)}>
      {children}
    </div>
  );
}
