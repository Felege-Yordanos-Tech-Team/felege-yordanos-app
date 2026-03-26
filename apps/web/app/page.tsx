import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="auth-bg-dark flex min-h-screen flex-col items-center justify-center px-6">
      {/* Sunday School icon */}
      <div className="mb-6 rounded-full border-2 border-[#D4A843]/30 p-1 shadow-lg shadow-[#D4A843]/10">
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
      <h1
        className="text-center text-[#FFFDF7] text-3xl tracking-wide leading-tight"
        style={{ fontFamily: "'Noto Serif Ethiopic', serif" }}
      >
        ፈለገ ዮርዳኖስ
      </h1>
      <h2
        className="mt-2 text-center text-[#FFFDF7]/80 text-2xl tracking-wide"
        style={{ fontFamily: "'Noto Serif Ethiopic', serif" }}
      >
        ሰንበት ት/ቤት
      </h2>

      <div className="mt-4 h-[1px] w-16 bg-gradient-to-r from-transparent via-[#D4A843]/50 to-transparent" />

      <p className="mt-4 text-center text-[#FFFDF7]/40 text-sm tracking-wider uppercase">
        Felege Yordanos Sunday School
      </p>

      {/* CTA */}
      <Button
        asChild
        className="mt-10 w-full max-w-xs rounded-md border border-[#D4A843]/50 bg-[#D4A843] py-6 text-base font-semibold text-[#0F1729] hover:bg-[#B8902F] transition-colors"
        size="lg"
      >
        <Link href="/login">Sign In</Link>
      </Button>

      <p className="mt-4 text-xs text-[#FFFDF7]/30">
        Ethiopian Orthodox Tewahedo Church
      </p>
    </div>
  );
}
