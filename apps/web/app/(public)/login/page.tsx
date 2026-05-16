'use client';

import { useState } from 'react';
import { createClient } from '@felege-yordanos/db';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
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

    const supabase = createClient();

    const { error: authError } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <div className="auth-bg-dark flex min-h-screen flex-col items-center justify-center px-6">
      {/* Logo */}
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

      {/* Title */}
      <h1 className="text-center text-[#fef9ea] text-xl font-headline">
        <span className="text-[#fed65b]">E</span>thiopian{' '}
        <span className="text-[#fed65b]">O</span>rthodox
      </h1>
      <h2 className="mt-0.5 text-center text-[#fef9ea] text-xl font-headline">
        Sunday <span className="text-[#fed65b]">S</span>chool
      </h2>

      <p className="mt-1 text-center text-[#735c00]/70 text-xs font-ethiopic">
        ፈለገ ዮርዳኖስ ሰንበት ት/ቤት
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-8 w-full max-w-sm space-y-5">
        <div className="space-y-2">
          <Label className="text-[#735c00] text-xs font-label uppercase tracking-wider">
            {isSignUp ? 'Email' : 'Email or Phone'}
          </Label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isSignUp ? 'you@example.com' : 'Email or Phone'}
            required
            className="w-full rounded-xl border border-[#735c00]/20 bg-[#2a2920] px-4 py-3 text-[#fef9ea] placeholder:text-[#fef9ea]/25 focus:border-[#735c00] focus:outline-none focus:ring-1 focus:ring-[#735c00]/30 transition-colors font-body"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[#735c00] text-xs font-label uppercase tracking-wider">
            Password
          </Label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="w-full rounded-xl border border-[#735c00]/20 bg-[#2a2920] px-4 py-3 text-[#fef9ea] placeholder:text-[#fef9ea]/25 focus:border-[#735c00] focus:outline-none focus:ring-1 focus:ring-[#735c00]/30 transition-colors font-body"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl border border-[#735c00]/30 sacred-gradient py-6 text-base font-semibold text-[#fef9ea] hover:opacity-90 transition-opacity"
        >
          {loading
            ? isSignUp ? 'Creating account...' : 'Logging in...'
            : isSignUp ? 'Register' : 'Login'}
        </Button>

        {!isSignUp && (
          <p className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-[#735c00]/60 hover:text-[#735c00] transition-colors font-label"
            >
              Forgot Password?
            </Link>
          </p>
        )}

        <div className="pt-2 text-center text-sm text-[#fef9ea]/40 font-label">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setError(''); }}
                className="text-[#fed65b] font-medium hover:underline"
              >
                Login
              </button>
            </p>
          ) : (
            <p>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setError(''); }}
                className="text-[#fed65b] font-medium hover:underline"
              >
                Register
              </button>
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
