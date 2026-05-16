'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@felege-yordanos/db';
import { Button } from '@/components/ui/button';
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

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo },
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
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
        <span className="text-[#fed65b]">R</span>eset{' '}
        <span className="text-[#fed65b]">P</span>assword
      </h1>
      <p className="mt-1 text-center text-[#735c00]/70 text-xs font-ethiopic">
        የይለፍ ቃል ዳግም አስጀምር
      </p>

      {sent ? (
        <div className="mt-8 w-full max-w-sm space-y-5 text-center">
          <p className="text-[#fef9ea] font-body">
            If an account exists for <span className="text-[#fed65b]">{email}</span>,
            a reset link has been sent. Check your inbox.
          </p>
          <Link
            href="/login"
            className="inline-block text-sm text-[#fed65b] font-medium hover:underline font-label"
          >
            Back to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 w-full max-w-sm space-y-5">
          <div className="space-y-2">
            <Label className="text-[#735c00] text-xs font-label uppercase tracking-wider">
              Email
            </Label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border border-[#735c00]/20 bg-[#2a2920] px-4 py-3 text-[#fef9ea] placeholder:text-[#fef9ea]/25 focus:border-[#735c00] focus:outline-none focus:ring-1 focus:ring-[#735c00]/30 transition-colors font-body"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border border-[#735c00]/30 sacred-gradient py-6 text-base font-semibold text-[#fef9ea] hover:opacity-90 transition-opacity"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <p className="text-center text-sm text-[#fef9ea]/40 font-label">
            Remembered it?{' '}
            <Link href="/login" className="text-[#fed65b] font-medium hover:underline">
              Back to Login
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
