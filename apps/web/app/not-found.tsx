import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="auth-bg-dark flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="text-[#fef9ea] text-3xl font-headline">
        <span className="text-[#fed65b]">P</span>age{' '}
        <span className="text-[#fed65b]">N</span>ot{' '}
        <span className="text-[#fed65b]">F</span>ound
      </h1>
      <p className="mt-2 text-[#735c00]/70 text-sm font-ethiopic">
        ይህ ገጽ አልተገኘም
      </p>

      <Button
        asChild
        className="mt-8 rounded-xl border border-[#735c00]/30 sacred-gradient px-8 py-6 text-base font-semibold text-[#fef9ea] hover:opacity-90 transition-opacity"
      >
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  );
}
