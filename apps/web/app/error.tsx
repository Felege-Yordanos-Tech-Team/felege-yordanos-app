'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="auth-bg-dark flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="text-[#fef9ea] text-3xl font-headline">
        <span className="text-[#fed65b]">S</span>omething{' '}
        <span className="text-[#fed65b]">W</span>ent{' '}
        <span className="text-[#fed65b]">W</span>rong
      </h1>
      <p className="mt-2 text-[#735c00]/70 text-sm font-ethiopic">
        ያልተጠበቀ ስህተት ተፈጥሯል
      </p>

      <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={reset}
          className="rounded-xl border border-[#735c00]/30 sacred-gradient py-6 text-base font-semibold text-[#fef9ea] hover:opacity-90 transition-opacity"
        >
          Try Again
        </Button>
        <Button
          asChild
          variant="outline"
          className="rounded-xl border-[#735c00]/30 py-6 text-base font-semibold text-[#fef9ea] hover:bg-[#735c00]/10 transition-colors"
        >
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
