'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { useT } from '@/lib/i18n/client';
import { cn } from '@/lib/utils';
import {
  AuthButton,
  AuthError,
  AuthFrame,
  AuthHeading,
  linkClass,
} from '../_components/auth-ui';
import { sendVerificationCode } from './actions';

const LENGTH = 6;
const EMPTY = Array<string>(LENGTH).fill('');

/** Better Auth Email OTP error codes -> message for the user. */
const ERRORS: Record<string, string> = {
  INVALID_OTP: 'Wrong code. Check the email and try again.',
  OTP_EXPIRED: 'This code has expired. Ask for a new code.',
  TOO_MANY_ATTEMPTS: 'Too many wrong tries. Ask for a new code.',
};

const boxClass =
  'h-[52px] w-full min-w-0 rounded-[10px] border border-parchment-edge bg-parchment-soft text-center font-mono text-[22px] font-semibold text-ink shadow-[inset_0_1px_2px_rgba(10,60,54,0.04)] outline-none transition-shadow focus-visible:border-gold/60 focus-visible:ring-2 focus-visible:ring-gold/25 disabled:opacity-60 md:h-14 dark:bg-parchment-deep dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]';

export function VerifyEmailForm({
  email,
  hasCode,
  resendIn,
  required,
  staff,
}: {
  email: string;
  /** A usable code was already sent (sign-up, or an earlier visit). */
  hasCode: boolean;
  /** Seconds until a new code may be sent. */
  resendIn: number;
  /** Sent here from a page that needs a verified email. */
  required: boolean;
  /** The profile has a staff role that starts after verification. */
  staff: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(EMPTY);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [resendAt, setResendAt] = useState(() => Date.now() + resendIn * 1000);
  const [now, setNow] = useState(() => Date.now());
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const autoSent = useRef(false);

  const wait = Math.max(0, Math.ceil((resendAt - now) / 1000));

  // Countdown for "Resend code".
  useEffect(() => {
    if (wait <= 0) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [wait]);

  // First visit without a code (e.g. an account from before verification
  // existed): send one. The server checks again, so a reload sends nothing.
  useEffect(() => {
    if (hasCode || autoSent.current) return;
    autoSent.current = true;
    send(true);
  }, [hasCode]);

  useEffect(() => {
    boxes.current[0]?.focus();
  }, []);

  async function send(auto: boolean) {
    setSending(true);
    setError('');
    try {
      const res = await sendVerificationCode(auto);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setNow(Date.now());
      setResendAt(Date.now() + res.data.resendIn * 1000);
      if (res.data.sent) {
        setNotice(auto ? 'We sent you a code.' : 'New code sent.');
        if (!auto) {
          setDigits(EMPTY);
          boxes.current[0]?.focus();
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  }

  async function verify(code: string) {
    if (verifying || code.length !== LENGTH) return;
    setVerifying(true);
    setError('');
    setNotice('');
    const { error: verifyError } = await authClient.emailOtp.verifyEmail({
      email,
      otp: code,
    });
    if (verifyError) {
      setError(
        (verifyError.code && ERRORS[verifyError.code]) ||
          (verifyError.status === 429
            ? 'Too many requests. Please try again later.'
            : 'Something went wrong. Please try again.'),
      );
      setDigits(EMPTY);
      setVerifying(false);
      // The boxes are disabled while verifying; focus once they are back.
      setTimeout(() => boxes.current[0]?.focus());
      return;
    }
    // The response refreshed the session cookie: access applies right away.
    router.replace('/dashboard');
    router.refresh();
  }

  /** Writes digits from box `start` on (typing, paste or SMS/email autofill). */
  function fill(start: number, value: string) {
    const incoming = value.replace(/\D/g, '');
    if (!incoming) return;
    const next = [...digits];
    // A full code pasted into any box replaces everything.
    const from = incoming.length >= LENGTH ? 0 : start;
    for (let i = 0; i < incoming.length && from + i < LENGTH; i++) {
      next[from + i] = incoming[i];
    }
    setDigits(next);
    setError('');
    const code = next.join('');
    if (code.length === LENGTH) {
      boxes.current[LENGTH - 1]?.blur();
      verify(code);
    } else {
      boxes.current[Math.min(from + incoming.length, LENGTH - 1)]?.focus();
    }
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault();
      const next = [...digits];
      next[i - 1] = '';
      setDigits(next);
      boxes.current[i - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) {
      boxes.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < LENGTH - 1) {
      boxes.current[i + 1]?.focus();
    }
  }

  async function signOut() {
    await authClient.signOut();
    router.replace('/login');
    router.refresh();
  }

  const [before, after] = t('Enter the 6-digit code we sent to {email}.').split(
    '{email}',
  );

  return (
    <AuthFrame>
      <AuthHeading
        en={['Verify your', 'email']}
        am={['ኢሜይልዎን', 'ያረጋግጡ']}
        sub={
          <>
            {before}
            <span className="break-words font-semibold text-ink">{email}</span>
            {after}
          </>
        }
      />

      {(required || staff) && (
        <div className="mb-4 space-y-1 rounded-[10px] bg-gold/10 px-3 py-2 text-[12.5px] text-brand-ink">
          {required && (
            <p>{t('Verify your email to use events, notices and donations.')}</p>
          )}
          {staff && (
            <p>{t('Your staff access starts after you verify your email.')}</p>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          verify(digits.join(''));
        }}
        className="flex flex-col"
      >
        <fieldset disabled={verifying}>
          <legend className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
            {t('Verification code')}
          </legend>
          <div className="grid grid-cols-6 gap-2 md:gap-2.5">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  boxes.current[i] = el;
                }}
                value={d}
                onChange={(e) => fill(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onPaste={(e) => {
                  e.preventDefault();
                  fill(i, e.clipboardData.getData('text'));
                }}
                onFocus={(e) => e.target.select()}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                maxLength={i === 0 ? LENGTH : 1}
                aria-label={t('Digit {n} of 6', { n: i + 1 })}
                aria-invalid={!!error}
                className={cn(boxClass, error && 'border-status-absent/60')}
              />
            ))}
          </div>
        </fieldset>

        <div className="mt-3.5 min-h-[20px]">
          {error ? (
            <AuthError>{t(error)}</AuthError>
          ) : notice ? (
            <p role="status" className="text-center text-xs text-ink-muted">
              {t(notice)}
            </p>
          ) : null}
        </div>

        <div className="mt-3.5">
          <AuthButton
            am="አረጋግጥ"
            disabled={verifying || digits.join('').length !== LENGTH}
          >
            {verifying ? t('Verifying…') : t('Verify email')}
          </AuthButton>
        </div>
      </form>

      <p className="mt-[18px] text-center text-xs text-ink-muted md:mt-5 md:text-[12.5px]">
        {t('Didn’t get it? Check your spam folder, or')}{' '}
        {wait > 0 ? (
          <span className="font-mono text-ink-faint">
            {t('resend in {s}s', { s: wait })}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => send(false)}
            disabled={sending}
            className={cn(linkClass, 'disabled:opacity-60')}
          >
            {sending ? t('Sending…') : t('resend the code')}
          </button>
        )}
      </p>
      <p className="mt-3 text-center text-xs text-ink-muted">
        {t('Wrong account?')}{' '}
        <button type="button" onClick={signOut} className={linkClass}>
          {t('Sign out')}
        </button>
      </p>
    </AuthFrame>
  );
}
