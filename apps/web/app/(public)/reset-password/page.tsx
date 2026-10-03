'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
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
      setError(updateError.message ?? 'Could not reset the password. Please try again.');
      setLoading(false);
      return;
    }

    // Resetting signs out every session, so the user signs in again.
    router.push('/login?reset=1');
  }

  const OrnamentRule = () => (
    <div className="my-5 flex items-center gap-2.5">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-parchment-edge dark:to-ink-muted/40" />
      <span className="flex items-center gap-1">
        <span className="h-1 w-1 rounded-full bg-gold opacity-40" />
        <span className="h-1 w-1 rounded-full bg-gold" />
        <span className="h-1 w-1 rounded-full bg-gold opacity-40" />
      </span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-parchment-edge dark:to-ink-muted/40" />
    </div>
  );

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
        {checking ? (
          <>
            <h1 className="text-center font-display text-[28px] font-medium leading-tight text-burgundy-ink dark:text-cream">
              Verifying <em className="text-gold-deep dark:text-gold">link</em>
            </h1>
            <p className="mt-1.5 text-center text-[13px] text-muted-foreground">
              One moment…
            </p>
            <OrnamentRule />
            <div className="flex justify-center">
              <span
                className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gold-deep/30 border-t-gold-deep dark:border-gold/30 dark:border-t-gold"
                aria-hidden
              />
            </div>
          </>
        ) : !token ? (
          <>
            <h1 className="text-center font-display text-[28px] font-medium leading-tight text-burgundy-ink dark:text-cream">
              Link <em className="text-gold-deep dark:text-gold">expired</em>
            </h1>
            <p className="mt-1.5 text-center text-[13px] text-muted-foreground">
              This reset link is invalid or has expired.
            </p>
            <OrnamentRule />
            <p className="text-center text-xs text-muted-foreground">
              <Link
                href="/forgot-password"
                className="font-semibold text-burgundy underline-offset-2 hover:underline dark:text-gold"
              >
                Request a new link
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-center font-display text-[28px] font-medium leading-tight text-burgundy-ink dark:text-cream">
              New <em className="text-gold-deep dark:text-gold">password</em>
            </h1>
            <p className="mt-1.5 text-center text-[13px] text-muted-foreground">
              <span className="font-ethiopic">አዲስ የይለፍ ቃል</span> · Choose a strong password
            </p>

            <OrnamentRule />

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                  New password
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-[13px] tracking-[0.25em] text-foreground placeholder:text-ink-faint placeholder:tracking-normal shadow-[inset_0_1px_2px_rgba(74,14,24,0.04)] focus-visible:ring-2 focus-visible:ring-gold/30 dark:bg-input"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                  Confirm password
                </Label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-[13px] tracking-[0.25em] text-foreground placeholder:text-ink-faint placeholder:tracking-normal shadow-[inset_0_1px_2px_rgba(74,14,24,0.04)] focus-visible:ring-2 focus-visible:ring-gold/30 dark:bg-input"
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
                <span className="font-ethiopic text-xs opacity-85">አስቀምጥ</span>
                <span className="h-3.5 w-px bg-gold/40" />
                <span>{loading ? 'Updating…' : 'Update password'}</span>
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
