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

/**
 * Page frame: phone = halo crown on top + form below;
 * desktop = brand panel (44%) on the left + centered form on the right.
 */
export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="parchment-bg flex min-h-screen flex-col md:flex-row">
      {/* Phone: halo crown */}
      <div className="sacred-gradient relative mx-4 mt-2 h-[280px] shrink-0 overflow-hidden rounded-b-xl rounded-t-[180px] shadow-[0_20px_40px_-20px_rgba(10,60,54,0.45),inset_0_-1px_0_rgba(212,168,67,0.25)] md:hidden">
        <div className="tibeb-gold pointer-events-none absolute inset-0 opacity-70" />
        <div className="pointer-events-none absolute left-1/2 top-[14%] h-[220px] w-[220px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(212,168,67,0.50)_0%,transparent_60%)] blur-[12px]" />
        <div className="relative flex h-full flex-col items-center justify-center px-6">
          <Medallion size={104} />
          <div className="mt-3.5">
            <ChurchName />
          </div>
        </div>
      </div>

      {/* Desktop: brand panel */}
      <div className="sacred-gradient relative hidden min-h-screen w-[44%] min-w-[380px] shrink-0 flex-col items-center justify-center overflow-hidden border-r border-gold/25 px-10 py-12 md:flex">
        <div className="tibeb-gold pointer-events-none absolute inset-0 opacity-70" />
        <HaloArch />
      </div>

      {/* Form */}
      <div className="relative flex flex-1 flex-col px-7 pb-6 pt-6 md:items-center md:justify-center md:p-10">
        <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_at_50%_0%,rgba(212,168,67,0.10)_0%,transparent_55%)] md:block dark:bg-[radial-gradient(ellipse_at_50%_0%,rgba(212,168,67,0.06)_0%,transparent_55%)]" />
        {/* Language switch: signed-out users need it too */}
        <div className="relative mb-4 flex justify-end md:absolute md:right-6 md:top-6 md:mb-0">
          <LangToggle />
        </div>
        <div className="relative w-full md:max-w-[380px]">{children}</div>
        <LegalFooter className="relative mt-auto pt-8 md:absolute md:inset-x-0 md:bottom-6 md:mt-0 md:pt-0" />
      </div>
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
