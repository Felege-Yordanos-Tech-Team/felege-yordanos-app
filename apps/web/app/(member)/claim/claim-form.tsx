'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Link2 } from 'lucide-react';
import { Card } from '@/components/ds';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useT } from '@/lib/i18n/client';
import { claimMember } from './actions';

export function ClaimForm() {
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const t = useT();

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    let res: Awaited<ReturnType<typeof claimMember>>;
    try {
      res = await claimMember(memberId);
    } catch {
      setError(t('Failed to link your profile. Please try again.'));
      setLoading(false);
      return;
    }

    if (!res.ok) {
      setError(t(res.error));
      setLoading(false);
      return;
    }

    const fullName = res.data.displayName;

    setLoading(false);
    toast({
      title: t('Profile linked!'),
      description: t('Welcome, {name}!', { name: fullName || t('member') }),
    });
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <Card className="p-[22px] md:p-[26px]">
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-full border border-gold/30 bg-gold/10 p-2.5 text-gold-deep">
          <Link2 className="h-4 w-4" />
        </div>
        <p className="text-[12.5px] leading-relaxed text-ink-muted">
          {t(
            'Enter your Sunday School member ID to connect your account with your existing member record.',
          )}
        </p>
      </div>

      <form onSubmit={handleClaim} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="member-id"
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep"
          >
            {t('Member ID')}
          </label>
          <Input
            id="member-id"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            placeholder={t('e.g. {id}', { id: 'ssu/01/03/05/0578' })}
            required
            aria-invalid={!!error}
            aria-describedby={error ? 'member-id-error' : undefined}
            className="h-auto rounded-[10px] border border-solid border-parchment-edge bg-parchment-soft px-3.5 py-[11px] font-mono text-[13px] text-ink shadow-[inset_0_1px_2px_rgba(10,60,54,0.04)] placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-gold/30 md:text-[13px] dark:bg-parchment-deep dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]"
          />
        </div>
        {error && (
          <p
            id="member-id-error"
            role="alert"
            className="rounded-[10px] bg-status-absent-bg px-3 py-2 text-[12.5px] text-status-absent"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="sacred-gradient flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 px-5 py-3 text-[13px] font-semibold tracking-[0.04em] text-cream shadow-fy-md transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          <Link2 className="h-3.5 w-3.5 text-gold" />
          {loading ? t('Linking…') : t('Link member record')}
        </button>
      </form>

      <div className="mt-3 text-center">
        <Link
          href="/dashboard"
          className="inline-block rounded-[10px] px-3 py-2 text-[12.5px] font-medium text-ink-muted transition-colors hover:bg-parchment-deep hover:text-ink"
        >
          {t('Skip for now')}
        </Link>
      </div>
    </Card>
  );
}
