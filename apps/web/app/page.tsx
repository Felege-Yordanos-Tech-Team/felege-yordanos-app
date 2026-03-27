import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="auth-bg-dark flex min-h-screen flex-col items-center justify-center px-6">
      {/* Sunday School icon */}
      <div className="mb-6 rounded-full border-2 border-[#735c00]/30 p-1 shadow-lg shadow-[#735c00]/10">
        <Image
          src="/ss-logo.png"
          alt="Felege Yordanos Sunday School"
          width={120}
          height={120}
          className="rounded-full"
          priority
        />
      </div>

      {/* Title */}
      <h1 className="text-center text-[#fef9ea] text-3xl font-headline leading-tight">
        ፈለገ ዮርዳኖስ
      </h1>
      <h2 className="mt-2 text-center text-[#fef9ea]/70 text-2xl font-headline">
        ሰንበት ት/ቤት
      </h2>

      <div className="mt-4 h-[1px] w-16 bg-gradient-to-r from-transparent via-[#735c00]/50 to-transparent" />

      <p className="mt-4 text-center text-[#fef9ea]/30 text-sm font-label tracking-wider uppercase">
        Felege Yordanos Sunday School
      </p>

      <Button
        asChild
        className="mt-10 w-full max-w-xs rounded-xl border border-[#735c00]/40 bg-[#735c00] py-6 text-base font-semibold text-[#fef9ea] hover:bg-[#735c00]/80 transition-colors"
        size="lg"
      >
        <Link href="/login">Sign In</Link>
      </Button>

      <p className="mt-4 text-xs text-[#fef9ea]/20 font-label">
        Ethiopian Orthodox Tewahedo Church
      </p>
    </div>
  );
}
