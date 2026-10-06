'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { useT } from '@/lib/i18n/client';
import {
  AuthButton,
  AuthError,
  AuthField,
  AuthFrame,
  AuthHeading,
  linkClass,
} from '../_components/auth-ui';

export default function ForgotPasswordPage() {
  const t = useT();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // The email link opens /reset-password?token=... (or ?error=INVALID_TOKEN).
    const { error: resetError } = await authClient.requestPasswordReset({
      email,
      redirectTo: '/reset-password',
    });

    if (resetError) {
      setError(resetError.message ?? 'Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <AuthFrame>
      {sent ? (
        <>
          <AuthHeading
            en={['Check your', 'inbox']}
            am={['ኢሜይልዎን', 'ይመልከቱ']}
            sub={t(
              'We sent a reset link to {email}. Tap it to choose a new password.',
              { email },
            )}
          />
          <p className="text-center text-xs text-ink-muted">
            {t('Didn’t get it? Check your spam folder, or')}{' '}
            <button
              type="button"
              onClick={() => setSent(false)}
              className={linkClass}
            >
              {t('try a different email')}
            </button>
          </p>
          <p className="mt-3 text-center text-xs text-ink-muted">
            <Link href="/login" className={linkClass}>
              {t('Back to sign in')}
            </Link>
          </p>
        </>
      ) : (
        <>
          <AuthHeading
            en={['Reset', 'password']}
            am={['የይለፍ ቃል', 'ዳግም ያስጀምሩ']}
            sub={t('Enter your email to receive a reset link')}
          />

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <AuthField
              label={t('Email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />

            {error && <AuthError>{t(error)}</AuthError>}

            <div className="mt-1">
              <AuthButton am="ላክ" disabled={loading}>
                {loading ? t('Sending…') : t('Send reset link')}
              </AuthButton>
            </div>
          </form>

          <p className="mt-[18px] text-center text-xs text-ink-muted md:mt-5 md:text-[12.5px]">
            {t('Remembered it?')}{' '}
            <Link href="/login" className={linkClass}>
              {t('Sign in')}
            </Link>
          </p>
        </>
      )}
    </AuthFrame>
  );
}
