'use client';

import { useState } from 'react';
import { createClient } from '@felege-yordanos/db';
import { useRouter } from 'next/navigation';
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
      {/* Cross ornament */}
      <div className="mb-6 flex flex-col items-center">
        <span className="text-4xl text-[#D4A843] leading-none" style={{ fontFamily: "'Noto Serif Ethiopic', serif" }}>
          ✞
        </span>
        <div className="mt-3 h-[1px] w-20 bg-gradient-to-r from-transparent via-[#D4A843] to-transparent" />
      </div>

      {/* Title */}
      <h1
        className="text-center text-[#FFFDF7] text-2xl tracking-wide"
        style={{ fontFamily: "'Noto Serif Ethiopic', serif" }}
      >
        <span className="text-[#D4A843]">Ethiopian </span>
        <span>Orthodox</span>
      </h1>
      <h2
        className="mt-1 text-center text-[#FFFDF7] text-2xl tracking-wide"
        style={{ fontFamily: "'Noto Serif Ethiopic', serif" }}
      >
        <span>Sunday </span>
        <span className="text-[#D4A843]">S</span>
        <span>chool</span>
      </h2>

      <p
        className="mt-2 text-center text-[#D4A843]/70 text-sm"
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
