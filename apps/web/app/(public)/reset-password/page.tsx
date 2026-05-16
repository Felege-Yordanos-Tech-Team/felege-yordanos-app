'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@felege-yordanos/db';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data, error: userError }) => {
      if (userError || !data.user) {
        setHasSession(false);
      } else {
        setHasSession(true);
      }
      setChecking(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="auth-bg-dark flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mb-4 rounded-full border-2 border-[#735c00]/30 p-1 shadow-lg shadow-[#735c00]/10">
        <Image
          src="/ss-logo.png"
          alt="Felege Yordanos Sunday School"
          width={96}
          height={96}
          className="rounded-full"
          priority
        />
      </div>

      <h1 className="text-center text-[#fef9ea] text-xl font-headline">
        <span className="text-[#fed65b]">N</span>ew{' '}
        <span className="text-[#fed65b]">P</span>assword
      </h1>
      <p className="mt-1 text-center text-[#735c00]/70 text-xs font-ethiopic">
        አዲስ የይለፍ ቃል
      </p>

      {checking ? (
        <p className="mt-8 text-[#fef9ea]/60 font-body">Checking session...</p>
      ) : !hasSession ? (
        <div className="mt-8 w-full max-w-sm space-y-5 text-center">
          <p className="text-[#fef9ea] font-body">
            This reset link is invalid or has expired.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block text-sm text-[#fed65b] font-medium hover:underline font-label"
          >
            Request a new link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 w-full max-w-sm space-y-5">
          <div className="space-y-2">
            <Label className="text-[#735c00] text-xs font-label uppercase tracking-wider">
              New Password
            </Label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              required
              minLength={6}
              className="w-full rounded-xl border border-[#735c00]/20 bg-[#2a2920] px-4 py-3 text-[#fef9ea] placeholder:text-[#fef9ea]/25 focus:border-[#735c00] focus:outline-none focus:ring-1 focus:ring-[#735c00]/30 transition-colors font-body"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#735c00] text-xs font-label uppercase tracking-wider">
              Confirm Password
            </Label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              required
              minLength={6}
              className="w-full rounded-xl border border-[#735c00]/20 bg-[#2a2920] px-4 py-3 text-[#fef9ea] placeholder:text-[#fef9ea]/25 focus:border-[#735c00] focus:outline-none focus:ring-1 focus:ring-[#735c00]/30 transition-colors font-body"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border border-[#735c00]/30 sacred-gradient py-6 text-base font-semibold text-[#fef9ea] hover:opacity-90 transition-opacity"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      )}
    </div>
  );
}
