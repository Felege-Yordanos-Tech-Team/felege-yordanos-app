'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function ResetPasswordPage() {
  const t = useT();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  // The reset email link lands here as /reset-password?token=...
  // An expired or used link arrives as ?error=INVALID_TOKEN instead.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get('error') ? null : params.get('token'));
    setChecking(false);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!token) return;

    setLoading(true);
    const { error: updateError } = await authClient.resetPassword({
      newPassword: password,
      token,
    });

    if (updateError) {
      setError(
        updateError.message ??
          'Could not reset the password. Please try again.',
      );
      setLoading(false);
      return;
    }

    // Resetting signs out every session, so the user signs in again.
    router.push('/login?reset=1');
  }

  return (
    <AuthFrame>
      {checking ? (
        <>
          <AuthHeading
            en={['Verifying', 'link']}
            am={['ሊንኩን', 'በማረጋገጥ ላይ']}
            sub={t('One moment…')}
          />
          <div className="flex justify-center">
            <span
              className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gold-deep/30 border-t-gold-deep"
              aria-hidden
            />
          </div>
        </>
      ) : !token ? (
        <>
          <AuthHeading
            en={['Link', 'expired']}
            am={['ሊንኩ', 'ጊዜው አልፏል']}
            sub={t('This reset link is invalid or has expired.')}
          />
          <p className="text-center text-xs text-ink-muted">
            <Link href="/forgot-password" className={linkClass}>
              {t('Request a new link')}
            </Link>
          </p>
        </>
      ) : (
        <>
          <AuthHeading
            en={['New', 'password']}
            am={['አዲስ', 'የይለፍ ቃል']}
            sub={t('Choose a strong password')}
          />

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <AuthField
              label={t('New password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={8}
            />
            <AuthField
              label={t('Confirm password')}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={8}
            />

            {error && <AuthError>{t(error)}</AuthError>}

            <div className="mt-1">
              <AuthButton am="አስቀምጥ" disabled={loading}>
                {loading ? t('Updating…') : t('Update password')}
              </AuthButton>
            </div>
          </form>
        </>
      )}
    </AuthFrame>
  );
}
