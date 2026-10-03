'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
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
    <div className="parchment-bg dark:bg-background flex min-h-screen flex-col">
      {/* Burgundy halo crown panel */}
      <div
        className="sacred-gradient relative mx-4 mt-2 h-[280px] overflow-hidden shadow-fy-lg"
        style={{ borderRadius: '180px 180px 12px 12px' }}
      >
        <div className="tibeb-gold absolute inset-0 opacity-70" />
        <div
          className="absolute left-1/2 top-[14%] h-[220px] w-[220px] -translate-x-1/2"
          style={{
            background:
              'radial-gradient(circle, rgba(212,168,67,0.5) 0%, transparent 60%)',
            filter: 'blur(12px)',
          }}
        />
        <div className="relative flex h-full flex-col items-center justify-center px-6">
          <div
            className="rounded-full p-1 backdrop-blur-sm"
            style={{
              border: '1.5px solid rgba(212,168,67,0.5)',
              background: 'rgba(74,14,24,0.4)',
              boxShadow: '0 8px 24px -6px rgba(0,0,0,0.4)',
            }}
          >
            <Image
              src="/ss-logo.png"
              alt="Felege Yordanos Sunday School"
              width={104}
              height={104}
              className="rounded-full"
              priority
            />
          </div>
          <div className="mt-3.5 font-ethiopic text-[20px] font-semibold tracking-wide text-cream">
            ፈለገ ዮርዳኖስ ሰንበት ት/ቤት
          </div>
          <div className="mt-0.5 font-display text-xs italic tracking-wider text-gold-light">
            Felege Yordanos Sunday School
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-1 flex-col px-7 pb-4 pt-6">
        {sent ? (
          <>
            <h1 className="text-center font-display text-[28px] font-medium leading-tight text-burgundy-ink dark:text-cream">
              Check your <em className="text-gold-deep dark:text-gold">inbox</em>
            </h1>
            <p className="mt-1.5 text-center text-[13px] text-muted-foreground">
              We sent a reset link to <span className="font-medium text-foreground">{email}</span>.
              Tap it to choose a new password.
            </p>

            <div className="my-5 flex items-center gap-2.5">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-parchment-edge dark:to-ink-muted/40" />
              <span className="flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-gold opacity-40" />
                <span className="h-1 w-1 rounded-full bg-gold" />
                <span className="h-1 w-1 rounded-full bg-gold opacity-40" />
              </span>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-parchment-edge dark:to-ink-muted/40" />
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Didn&apos;t get it? Check your spam folder, or{' '}
              <button
                type="button"
                onClick={() => setSent(false)}
                className="font-semibold text-burgundy underline-offset-2 hover:underline dark:text-gold"
              >
                try a different email
              </button>
              .
            </p>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              <Link
                href="/login"
                className="font-semibold text-burgundy underline-offset-2 hover:underline dark:text-gold"
              >
                Back to sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-center font-display text-[28px] font-medium leading-tight text-burgundy-ink dark:text-cream">
              Reset <em className="text-gold-deep dark:text-gold">password</em>
            </h1>
            <p className="mt-1.5 text-center text-[13px] text-muted-foreground">
              <span className="font-ethiopic">የይለፍ ቃል ዳግም አስጀምር</span> · Enter your email to
              receive a reset link
            </p>

            <div className="my-5 flex items-center gap-2.5">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-parchment-edge dark:to-ink-muted/40" />
              <span className="flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-gold opacity-40" />
                <span className="h-1 w-1 rounded-full bg-gold" />
                <span className="h-1 w-1 rounded-full bg-gold opacity-40" />
              </span>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-parchment-edge dark:to-ink-muted/40" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                  Email
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-ink-faint shadow-[inset_0_1px_2px_rgba(74,14,24,0.04)] focus-visible:ring-2 focus-visible:ring-gold/30 dark:bg-input"
                />
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="sacred-gradient mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-[15px] text-sm font-semibold tracking-wider text-cream shadow-[0_6px_16px_-6px_rgba(74,14,24,0.4),inset_0_1px_0_rgba(212,168,67,0.25)] transition-opacity hover:opacity-95 disabled:opacity-70"
                style={{ border: '1px solid rgba(212,168,67,0.4)' }}
              >
                <span className="font-ethiopic text-xs opacity-85">ላክ</span>
                <span className="h-3.5 w-px bg-gold/40" />
                <span>{loading ? 'Sending…' : 'Send reset link'}</span>
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Remembered it?{' '}
              <Link
                href="/login"
                className="font-semibold text-burgundy underline-offset-2 hover:underline dark:text-gold"
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
