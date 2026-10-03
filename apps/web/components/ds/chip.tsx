import { cn } from '@/lib/utils';

/** Filter pill. Active = brand fill. */
export function Chip({
  active,
  dot,
  amharic,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; dot?: string; amharic?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-[5px] text-[11px] transition-colors',
        amharic ? 'font-ethiopic' : 'font-body',
        active
          ? 'bg-brand font-semibold text-cream'
          : 'border border-parchment-edge bg-parchment-soft font-medium text-ink hover:bg-parchment-deep',
        className,
      )}
      {...rest}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />}
      {children}
    </button>
  );
}
