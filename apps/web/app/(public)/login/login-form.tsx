'use client';

import { useState } from 'react';
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

export function LoginForm() {
  const t = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = isSignUp
      ? await authClient.signUp.email({ email, password, name: email })
      : await authClient.signIn.email({ email, password });

    if (authError) {
      setError(authError.message ?? 'Something went wrong. Please try again.');
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  function switchMode(signUp: boolean) {
    setIsSignUp(signUp);
    setError('');
  }

  return (
    <AuthFrame>
      {isSignUp ? (
        <AuthHeading
          en={['Create', 'account']}
          am={['መለያ', 'ይፍጠሩ']}
          sub={t('Join your Sunday School community')}
        />
      ) : (
        <AuthHeading
          en={['Welcome', 'back']}
          am={['እንኳን ደህና', 'መጡ']}
          sub={t('Sign in to continue to your Sunday School')}
        />
      )}

      <form onSubmit={handleSubmit} className="flex flex-col">
        <AuthField
          label={t('Email')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          className="mb-3.5"
        />
        <AuthField
          label={t('Password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          required
          // New passwords need 8+ characters. Existing members may still
          // have shorter passwords from the old system, so sign-in allows them.
          minLength={isSignUp ? 8 : undefined}
          className="mb-2"
        />

        {isSignUp ? (
          <div className="mb-[18px] md:mb-5" />
        ) : (
          <div className="mb-[18px] text-right md:mb-5">
            <Link
              href="/forgot-password"
              className="text-[11px] font-medium text-gold-deep transition-colors hover:text-brand md:text-[11.5px] dark:hover:text-gold-light"
            >
              {t('Forgot password?')}
            </Link>
          </div>
        )}

        {error && (
          <div className="mb-3.5">
            <AuthError>{t(error)}</AuthError>
          </div>
        )}

        <AuthButton am={isSignUp ? 'ይመዝገቡ' : 'ግባ'} disabled={loading}>
          {loading
            ? isSignUp
              ? t('Creating account…')
              : t('Signing in…')
            : isSignUp
              ? t('Create account')
              : t('Sign in')}
        </AuthButton>
      </form>

      <p className="mt-[18px] text-center text-xs text-ink-muted md:mt-5 md:text-[12.5px]">
        {isSignUp ? (
          <>
            {t('Already have an account?')}{' '}
            <button
              type="button"
              onClick={() => switchMode(false)}
              className={linkClass}
            >
              {t('Sign in')}
            </button>
          </>
        ) : (
          <>
            {t('New here?')}{' '}
            <button
              type="button"
              onClick={() => switchMode(true)}
              className={linkClass}
            >
              {t('Create an account')}
            </button>
          </>
        )}
      </p>
    </AuthFrame>
  );
}
