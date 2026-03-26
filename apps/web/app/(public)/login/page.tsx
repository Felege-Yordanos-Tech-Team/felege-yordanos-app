'use client';

import { useState } from 'react';
import { createClient } from '@felege-yordanos/db';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
      {/* Sunday School icon */}
      <div className="mb-4 rounded-full border-2 border-[#D4A843]/30 p-1 shadow-lg shadow-[#D4A843]/10">
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
      <h1
        className="text-center text-[#FFFDF7] text-xl tracking-wide"
        style={{ fontFamily: "'Noto Serif Ethiopic', serif" }}
      >
        <span className="text-[#D4A843]">E</span>thiopian{' '}
        <span className="text-[#D4A843]">O</span>rthodox
      </h1>
      <h2
        className="mt-0.5 text-center text-[#FFFDF7] text-xl tracking-wide"
        style={{ fontFamily: "'Noto Serif Ethiopic', serif" }}
      >
        Sunday <span className="text-[#D4A843]">S</span>chool
      </h2>

      <p
        className="mt-1 text-center text-[#D4A843]/60 text-xs"
        style={{ fontFamily: "'Noto Serif Ethiopic', serif" }}
      >
        ፈለገ ዮርዳኖስ ሰንበት ት/ቤት
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-10 w-full max-w-sm space-y-5">
        <div className="space-y-2">
          <Label className="text-[#D4A843]/80 text-xs uppercase tracking-wider">
            {isSignUp ? 'Email' : 'Email or Phone'}
          </Label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isSignUp ? 'you@example.com' : 'Email or Phone'}
            required
            className="w-full rounded-md border border-[#D4A843]/30 bg-[#0A0F1E] px-4 py-3 text-[#FFFDF7] placeholder:text-[#FFFDF7]/30 focus:border-[#D4A843] focus:outline-none focus:ring-1 focus:ring-[#D4A843]/40 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[#D4A843]/80 text-xs uppercase tracking-wider">
            Password
          </Label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="w-full rounded-md border border-[#D4A843]/30 bg-[#0A0F1E] px-4 py-3 text-[#FFFDF7] placeholder:text-[#FFFDF7]/30 focus:border-[#D4A843] focus:outline-none focus:ring-1 focus:ring-[#D4A843]/40 transition-colors"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-md border border-[#D4A843]/50 bg-[#6B1D2A] py-6 text-base font-semibold text-[#FFFDF7] hover:bg-[#8A2E3D] transition-colors"
        >
          {loading
            ? isSignUp ? 'Creating account...' : 'Logging in...'
            : isSignUp ? 'Register' : 'Login'}
        </Button>

        {!isSignUp && (
          <p className="text-center">
            <button
              type="button"
              className="text-sm text-[#D4A843]/70 hover:text-[#D4A843] transition-colors"
            >
              Forgot Password?
            </button>
          </p>
        )}

        <div className="pt-2 text-center text-sm text-[#FFFDF7]/50">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setError(''); }}
                className="text-[#D4A843] font-medium hover:underline"
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
                className="text-[#D4A843] font-medium hover:underline"
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
