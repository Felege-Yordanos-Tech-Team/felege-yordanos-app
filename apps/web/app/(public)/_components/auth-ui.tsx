'use client';

import { LangToggle } from '@/components/lang-toggle';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useLocale, useT } from '@/lib/i18n/client';
import { cn } from '@/lib/utils';

/* Shared pieces of the sign-in screens. */

function DotTriplet({ size = 3 }: { size?: number }) {
  return (
    <span className="flex items-center" style={{ gap: size }}>
      <span className="rounded-full bg-gold opacity-40" style={{ width: size, height: size }} />
      <span className="rounded-full bg-gold" style={{ width: size, height: size }} />
      <span className="rounded-full bg-gold opacity-40" style={{ width: size, height: size }} />
    </span>
  );
}

/** Logo medallion in a gold ring. */
export function Medallion({ size }: { size: number }) {
  return (
    <div className="rounded-full border-[1.5px] border-gold/50 bg-brand-deep/40 p-1 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.4)] backdrop-blur-sm">
      <Image
        src="/ss-logo.png"
        alt="Felege Yordanos Sunday School"
        width={size}
        height={size}
        className="rounded-full"
        priority
      />
    </div>
  );
}

/** Church name: Amharic first, English italic below. */
export function ChurchName({ large = false }: { large?: boolean }) {
  return (
    <div className="relative text-center">
      <div
        className={cn(
          'font-ethiopic font-semibold tracking-[0.02em] text-cream',
          large ? 'text-2xl' : 'text-xl',
        )}
      >
        ፈለገ ዮርዳኖስ ሰንበት ት/ቤት
      </div>
      <div
        className={cn(
          'font-display italic tracking-[0.04em] text-gold-light',
          large ? 'mt-1 text-sm' : 'mt-0.5 text-xs',
        )}
      >
        Felege Yordanos Sunday School
      </div>
    </div>
  );
}

/** Desktop brand content: halo arch around the medallion, name, and the three pillars. */
export function HaloArch() {
  return (
    <>
      <div className="pointer-events-none absolute left-1/2 top-[22%] h-80 w-80 -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(212,168,67,0.40)_0%,transparent_60%)] blur-[14px]" />
      <div className="relative flex h-[264px] w-[216px] flex-col items-center justify-center gap-3.5 rounded-b-2xl rounded-t-[120px] border-[1.5px] border-gold/45 bg-brand-deep/35 shadow-[0_20px_44px_-20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(212,168,67,0.2)]">
        <Medallion size={120} />
        <DotTriplet size={4} />
      </div>
      <div className="mt-[26px]">
        <ChurchName large />
      </div>
      <div className="relative mt-[30px] flex items-center gap-3 font-ethiopic text-[12.5px] text-cream/65">
        <span>መዝሙር</span>
        <span className="text-[10px] text-gold/60">✣</span>
        <span>ክትትል</span>
        <span className="text-[10px] text-gold/60">✣</span>
        <span>መዋጮ</span>
      </div>
    </>
  );
}

// Same floating look as the desktop sidebar (components/sidebar/sidebar-nav.tsx).
const floatingRail =
  'rail-sacred rounded-[14px] border border-gold/[0.22] shadow-[0_10px_30px_-14px_rgba(10,60,54,0.35),0_2px_6px_-2px_rgba(10,60,54,0.10)] dark:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)]';

/** Desktop brand panel content: medallion, church name, one line about the app. */
function BrandPanel() {
  const t = useT();
  const locale = useLocale();
  return (
    <div className="relative flex max-w-[360px] flex-col items-center text-center">
      <div className="pointer-events-none absolute left-1/2 top-[64px] h-72 w-72 -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(212,168,67,0.32)_0%,transparent_62%)] blur-[14px]" />
      <div className="relative">
        <Medallion size={120} />
      </div>
      {/* Smaller below lg so the name stays on one line in the narrow panel. */}
      <div className="mt-6 whitespace-nowrap">
        <div className="font-ethiopic text-[21px] font-semibold tracking-[0.02em] text-cream lg:text-2xl">
          ፈለገ ዮርዳኖስ ሰንበት ት/ቤት
        </div>
        <div className="mt-1 font-display text-sm italic tracking-[0.04em] text-gold-light">
          Felege Yordanos Sunday School
        </div>
      </div>
      <div className="my-6 flex w-40 items-center gap-2.5">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/40" />
        <DotTriplet size={4} />
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/40" />
      </div>
      <p
        className={cn(
          'text-cream/75',
          locale === 'am' ? 'font-ethiopic text-[14px]' : 'text-[13.5px]',
        )}
      >
        {t('Songbook, attendance and donations in one place.')}
      </p>
    </div>
  );
}

/**
 * Page frame. Desktop: floating teal brand panel on the left (styled like
 * the sidebar) + the form card on the right. Phone: the dome (medallion and
 * name under an arch) on top + the form card centered below.
 */
export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="parchment-bg flex min-h-screen flex-col md:flex-row">
      {/* Desktop: floating brand panel */}
      <aside
        className={cn(
          floatingRail,
          'sticky top-2.5 my-2.5 ml-2.5 hidden h-[calc(100vh-20px)] w-[42%] min-w-[340px] max-w-[600px] shrink-0 flex-col items-center justify-center self-start overflow-hidden px-8 md:flex lg:px-10',
        )}
      >
        <BrandPanel />
      </aside>

      {/* Phone: dome, with the language switch on its bottom edge */}
      <div className="relative mx-4 mt-2 shrink-0 md:hidden">
        <div className="sacred-gradient relative h-[212px] overflow-hidden rounded-b-xl rounded-t-[180px] shadow-[0_20px_40px_-20px_rgba(10,60,54,0.45),inset_0_-1px_0_rgba(212,168,67,0.25)]">
          <div className="tibeb-gold pointer-events-none absolute inset-0 opacity-70" />
          <div className="pointer-events-none absolute left-1/2 top-[14%] h-[190px] w-[190px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(212,168,67,0.50)_0%,transparent_60%)] blur-[12px]" />
          <div className="relative flex h-full flex-col items-center justify-center px-6 pt-3">
            <Medallion size={88} />
            <div className="mt-3">
              <ChurchName />
            </div>
          </div>
        </div>
        <div className="absolute -bottom-4 right-4">
          <LangToggle className="bg-parchment-soft shadow-[0_4px_12px_-6px_rgba(10,60,54,0.35)]" />
        </div>
      </div>

      {/* Form */}
      <main className="relative flex flex-1 flex-col px-4 pb-5 pt-7 md:items-center md:justify-center md:px-10 md:py-16">
        {/* Language switch: signed-out users need it too (phone: on the dome) */}
        <div className="absolute right-6 top-6 hidden md:block">
          <LangToggle />
        </div>
        {/* Phone: the card sits in the middle of the space below the dome. */}
        <div className="flex w-full flex-1 flex-col justify-center md:max-w-[420px] md:flex-none">
          <div className="w-full rounded-2xl border border-parchment-edge bg-parchment-soft px-5 py-6 shadow-[0_1px_0_rgba(10,60,54,0.04),0_14px_36px_-18px_rgba(10,60,54,0.28)] md:px-9 md:py-10 dark:shadow-[0_14px_36px_-18px_rgba(0,0,0,0.6)]">
            {children}
          </div>
        </div>
        <LegalFooter className="pt-5 md:absolute md:inset-x-0 md:bottom-6 md:pt-0" />
      </main>
    </div>
  );
}

/** Google's "G" mark, unmodified (https://developers.google.com/identity/branding-guidelines). */
function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="h-[18px] w-[18px] shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/**
 * "Continue with Google" (Google's button guidelines: neutral button, the
 * standard G mark). Colors in `.google-button` (app/global.css).
 */
export function GoogleButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="google-button flex h-11 w-full items-center justify-center gap-3 rounded-xl border px-4 text-sm font-medium transition-colors disabled:opacity-60"
    >
      <GoogleMark />
      <span>{disabled ? t('Opening Google…') : t('Continue with Google')}</span>
    </button>
  );
}

/** "or" rule between the Google button and the email form. */
export function OrDivider() {
  const t = useT();
  return (
    <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
      <span className="h-px flex-1 bg-parchment-edge" />
      <span>{t('or')}</span>
      <span className="h-px flex-1 bg-parchment-edge" />
    </div>
  );
}

/** Centered title + subtitle + ornament rule. `title` is [plain, emphasised] per language. */
export function AuthHeading({
  en,
  am,
  sub,
}: {
  en: [string, string];
  am: [string, string];
  sub: React.ReactNode;
}) {
  const locale = useLocale();
  const [plain, em] = locale === 'am' ? am : en;
  return (
    <>
      <h1
        className={cn(
          'text-center leading-[1.1] text-brand-ink',
          locale === 'am'
            ? 'font-ethiopic text-[25px] font-semibold md:text-[29px]'
            : 'font-display text-[28px] font-medium md:text-[34px]',
        )}
      >
        {plain} <em className={cn('text-gold-deep', locale === 'am' ? 'not-italic' : 'italic')}>{em}</em>
      </h1>
      <p className="mt-1.5 text-center text-[13px] text-ink-muted md:mt-2">{sub}</p>
      <div className="mb-[22px] mt-[18px] flex items-center gap-2.5 md:mb-[26px] md:mt-[22px]">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-parchment-edge" />
        <DotTriplet />
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-parchment-edge" />
      </div>
    </>
  );
}

const inputClass =
  'w-full rounded-[10px] border border-parchment-edge bg-parchment-soft px-3.5 py-[11px] text-[13px] text-ink shadow-[inset_0_1px_2px_rgba(10,60,54,0.04)] outline-none transition-shadow placeholder:text-ink-faint focus-visible:border-gold/60 focus-visible:ring-2 focus-visible:ring-gold/25 dark:bg-parchment-deep dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]';

/** Label + input. Password fields get a show/hide eye. */
export function AuthField({
  label,
  type = 'text',
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const t = useT();
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
        {label}
      </span>
      <span className="relative block">
        <input
          type={isPassword && show ? 'text' : type}
          className={cn(
            inputClass,
            isPassword && 'pr-10',
            isPassword && !show && 'tracking-[0.25em] placeholder:tracking-normal',
          )}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? t('Hide password') : t('Show password')}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-faint transition-colors hover:text-gold-deep"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </span>
    </label>
  );
}

/**
 * Primary CTA. In English the Amharic word
 * leads as an accent; in Amharic only the Amharic label shows.
 */
export function AuthButton({
  am,
  children,
  disabled,
}: {
  /** Amharic accent shown before the English label. */
  am: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const locale = useLocale();
  return (
    <button
      type="submit"
      disabled={disabled}
      className="sacred-gradient flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 px-6 py-[15px] text-sm font-semibold tracking-[0.04em] text-cream shadow-[0_6px_16px_-6px_rgba(10,60,54,0.4),inset_0_1px_0_rgba(212,168,67,0.25)] transition-opacity hover:opacity-95 disabled:opacity-70"
    >
      {locale !== 'am' && (
        <>
          <span className="font-ethiopic text-xs opacity-85">{am}</span>
          <span className="h-3.5 w-px bg-gold/40" />
        </>
      )}
      <span className={locale === 'am' ? 'font-ethiopic' : undefined}>{children}</span>
    </button>
  );
}

export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-[10px] bg-status-absent-bg px-3 py-2 text-xs text-status-absent">
      {children}
    </p>
  );
}

export const linkClass =
  'font-semibold text-brand underline-offset-2 hover:underline dark:text-gold-light';

/** "Privacy · Terms" links. `onDark` for the brand gradient (landing page). */
export function LegalFooter({
  onDark = false,
  className,
}: {
  onDark?: boolean;
  className?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const link = cn(
    'underline-offset-2 transition-colors hover:underline',
    onDark ? 'text-cream/60 hover:text-cream' : 'text-ink-muted hover:text-brand dark:hover:text-gold-light',
  );
  return (
    <nav
      aria-label={t('Privacy') + ' · ' + t('Terms')}
      className={cn(
        'flex items-center justify-center gap-2.5 text-[11.5px]',
        locale === 'am' && 'font-ethiopic',
        className,
      )}
    >
      <Link href="/privacy" className={link}>
        {t('Privacy')}
      </Link>
      <span aria-hidden className={onDark ? 'text-gold/50' : 'text-gold-deep/60'}>
        ·
      </span>
      <Link href="/terms" className={link}>
        {t('Terms')}
      </Link>
    </nav>
  );
}
