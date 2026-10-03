import Link from 'next/link';
import { LogoCross } from '@/components/brand/logo-cross';

/** Full-screen message for not-found and error pages, in the brand style. */
export function StatusPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="parchment-bg flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <LogoCross size={64} />
      <h1 className="mt-6 font-display text-[30px] font-medium leading-tight text-brand-ink">
        {title}
      </h1>
      <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>
      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">{children}</div>
    </div>
  );
}

export const primaryButton =
  'sacred-gradient inline-flex items-center justify-center rounded-xl border border-gold/40 px-6 py-3 text-sm font-semibold text-cream shadow-fy-md transition-opacity hover:opacity-95';
export const secondaryButton =
  'inline-flex items-center justify-center rounded-xl border border-parchment-edge bg-parchment-soft px-6 py-3 text-sm font-semibold text-brand-ink transition-colors hover:bg-parchment-deep';

export function HomeLink({ label }: { label: string }) {
  return (
    <Link href="/" className={primaryButton}>
      {label}
    </Link>
  );
}
