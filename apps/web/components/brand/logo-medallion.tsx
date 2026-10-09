import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * The painted Sunday School logo (/ss-logo.png) in a thin gold ring, for the
 * sidebar and the mobile header. Sign-in screens use their own larger
 * Medallion (app/(public)/_components/auth-ui.tsx).
 */
export function LogoMedallion({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'block shrink-0 rounded-full border border-gold/60 bg-brand-deep/40 p-[2px] shadow-[0_6px_18px_-6px_rgba(0,0,0,0.45)]',
        className,
      )}
    >
      <Image
        src="/ss-logo.png"
        alt="Felege Yordanos Sunday School"
        width={size}
        height={size}
        className="block rounded-full"
      />
    </span>
  );
}
