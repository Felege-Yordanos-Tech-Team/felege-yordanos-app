'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@felege-yordanos/db';
import type { UserRole, Member } from '@felege-yordanos/db';
import { Link2, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MemberQRCard } from './member-qr-card';

interface ProfileFormProps {
  profileId: string;
  email: string;
  displayName: string;
  role: UserRole;
  member: Member | null;
}

const ROLE_STYLES: Record<UserRole, { bg: string; text: string; label: string }> = {
  member: {
    bg: 'bg-parchment-deep dark:bg-ink-faint/20',
    text: 'text-ink-muted dark:text-cream/70',
    label: 'member',
  },
  dept_head: {
    bg: 'bg-gold/[0.20] dark:bg-gold/[0.18]',
    text: 'text-gold-deep dark:text-gold',
    label: 'dept head',
  },
  admin: {
    bg: 'bg-burgundy/[0.12] dark:bg-burgundy/30',
    text: 'text-burgundy dark:text-gold-light',
    label: 'admin',
  },
  super_admin: {
    bg: 'bg-burgundy',
    text: 'text-gold',
    label: 'super admin',
  },
};

function getInitials(name: string, fallback: string): string {
  const source = (name || fallback).trim();
  if (!source) return '··';
  const parts = source.split(/\s+/).slice(0, 2);
  return parts.map((w) => w[0]?.toUpperCase() ?? '').join('') || '··';
}

export function ProfileForm({
  profileId,
  email,
  displayName,
  role,
  member,
}: ProfileFormProps) {
  const [name, setName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const initials = getInitials(displayName || member?.name || '', email);
  const fullName = displayName || member?.name || email;
  const roleStyle = ROLE_STYLES[role];

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: name } as never)
      .eq('id', profileId);
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Your profile has been updated.' });
      router.refresh();
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="mt-3.5 space-y-4">
      {/* Avatar + name */}
      <div className="flex items-center gap-3.5">
        <div
          className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full font-display text-[22px] font-bold text-burgundy-deep shadow-fy-gold"
          style={{ background: 'linear-gradient(135deg, #D4A843, #A47A18)' }}
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[19px] font-medium leading-tight text-burgundy-ink dark:text-cream">
            {fullName}
          </div>
          <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
            {email}
          </div>
          <span
            className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] ${roleStyle.bg} ${roleStyle.text}`}
          >
            {roleStyle.label}
          </span>
        </div>
      </div>

      {/* QR card — only when a member record is linked */}
      {member && <MemberQRCard memberId={member.member_id} />}

      {/* Claim prompt — when not linked */}
      {!member && (
        <div className="gold-accent-l rounded-2xl border border-border bg-card px-4 py-3 pl-5">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-burgundy/[0.10] p-2.5 dark:bg-gold/[0.12]">
              <Link2 className="h-4 w-4 text-burgundy dark:text-gold" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Link your member profile
              </p>
              <p className="text-[11px] text-muted-foreground">
                Required to get your check-in QR code
              </p>
            </div>
            <Button
              asChild
              size="sm"
              className="rounded-lg bg-burgundy px-3 py-1.5 text-xs font-semibold text-cream hover:bg-burgundy-soft dark:bg-gold dark:text-burgundy-ink dark:hover:bg-gold-light"
            >
              <Link href="/claim">Link</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Account section */}
      <section>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep dark:text-gold">
          Account
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3.5">
          <div className="space-y-1.5">
            <Label
              htmlFor="display-name"
              className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold"
            >
              Display name
            </Label>
            <Input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="rounded-[10px] border border-border bg-background text-[13.5px] text-foreground placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-gold/30"
            />
          </div>

          {member && (
            <div className="mt-3.5 border-t border-border pt-3.5">
              <Label className="block text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                Member record · linked
              </Label>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded bg-burgundy/[0.08] px-2 py-0.5 font-mono text-[11px] font-semibold text-burgundy dark:bg-gold/[0.10] dark:text-gold-light">
                  {member.member_id}
                </span>
                <Link2 className="h-3 w-3 text-status-present" />
              </div>
              <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                {[member.name, member.father_name, member.grandfather_name]
                  .filter(Boolean)
                  .join(' ')}
                {member.gender ? ` · ${member.gender}` : ''}
                {member.address_phone ? ` · ${member.address_phone}` : ''}
              </p>
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saving || name === displayName}
            className="sacred-gradient mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 py-2.5 text-sm font-semibold text-cream shadow-fy-md transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </section>

      {/* Sign out */}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-transparent py-2.5 text-[13px] font-medium text-status-absent transition-colors hover:bg-status-absent/[0.06] disabled:opacity-60"
      >
        <LogOut className="h-3.5 w-3.5" />
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  );
}
