import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getLocale, getT } from '@/lib/i18n/server';
import { getSession } from '@/lib/session';
import { cn } from '@/lib/utils';
import { HaloArch } from './(public)/_components/auth-ui';

/** Signed-out landing: the brand panel of the sign-in design, full screen. */
export default async function LandingPage() {
  if (await getSession()) redirect('/dashboard');
  const [t, locale] = await Promise.all([getT(), getLocale()]);

  return (
    <div className="sacred-gradient relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">
      <div className="tibeb-gold pointer-events-none absolute inset-0 opacity-70" />
      <HaloArch />

      <Link
        href="/login"
        className="relative mt-10 flex w-full max-w-xs items-center justify-center gap-2 rounded-xl border border-gold/50 bg-gold px-6 py-[15px] text-sm font-semibold tracking-[0.04em] text-brand-deep shadow-fy-gold transition-colors hover:bg-gold-light"
      >
        {locale !== 'am' && (
          <>
            <span className="font-ethiopic text-xs opacity-80">ግቢ</span>
            <span className="h-3.5 w-px bg-brand-deep/30" />
          </>
        )}
        <span className={cn(locale === 'am' && 'font-ethiopic')}>
          {t('Sign in')}
        </span>
      </Link>

      <p className="relative mt-5 text-center font-display text-[13px] italic tracking-[0.04em] text-cream/45">
        {t('Ethiopian Orthodox Tewahedo Church')}
      </p>
    </div>
  );
}
