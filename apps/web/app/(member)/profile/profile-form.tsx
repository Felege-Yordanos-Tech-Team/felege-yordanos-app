'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { members, Role } from '@felege-yordanos/db/schema';
import { KeyRound, Link2, LogOut, Pencil, Printer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MemberQR } from '@/components/member-qr';
import { authClient } from '@/lib/auth-client';
import { MemberQRCard } from './member-qr-card';
import { updateDisplayName } from './actions';

type Member = typeof members.$inferSelect;

/** The fields of the linked member record this screen shows. */
export type LinkedMember = Pick<
  Member,
  | 'memberId'
  | 'name'
  | 'fatherName'
  | 'grandfatherName'
  | 'gender'
  | 'addressPhone'
>;

interface ProfileFormProps {
  email: string;
  displayName: string;
  role: Role;
  member: LinkedMember | null;
  /** Department display name (Amharic) for the desktop info card. */
  deptName?: string | null;
}

const ROLE_STYLES: Record<Role, { bg: string; text: string; label: string }> = {
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
  email,
  displayName,
  role,
  member,
  deptName,
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
    const res = await updateDisplayName(name);
    setSaving(false);
    if (!res.ok) {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Your profile has been updated.' });
      router.refresh();
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      {/* ─── MOBILE (< md) — single column ─── */}
      <div className="mt-3.5 space-y-4 md:hidden">
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
        {member && <MemberQRCard memberId={member.memberId} />}

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
                    {member.memberId}
                  </span>
                  <Link2 className="h-3 w-3 text-status-present" />
                </div>
                <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                  {[member.name, member.fatherName, member.grandfatherName]
                    .filter(Boolean)
                    .join(' ')}
                  {member.gender ? ` · ${member.gender}` : ''}
                  {member.addressPhone ? ` · ${member.addressPhone}` : ''}
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

      {/* ─── DESKTOP (md+) — two-column: info card + QR card ─── */}
      <div className="hidden md:block">
        {/* Page head */}
        <div className="mb-4">
          <div className="font-ethiopic text-xs font-medium tracking-[0.06em] text-gold-deep dark:text-gold">
            መገለጫ
          </div>
          <h1 className="mt-0.5 font-display text-[30px] font-medium leading-[1.05] text-burgundy-ink dark:text-cream">
            My profile
          </h1>
        </div>

        <div className="grid grid-cols-[1fr_380px] items-start gap-4">
          {/* Info card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-fy-sm">
            {/* Avatar + name */}
            <div className="mb-5 flex items-center gap-4">
              <div
                className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full font-display text-[22px] font-bold text-burgundy-deep shadow-fy-gold"
                style={{
                  background: 'linear-gradient(135deg, #D4A843, #A47A18)',
                }}
                aria-hidden
              >
                {initials}
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-2xl font-medium leading-tight text-burgundy-ink dark:text-cream">
                  {fullName}
                </h3>
                <div className="mt-1.5 flex items-center gap-2">
                  {member && (
                    <span className="rounded-full border border-gold/30 bg-gold/[0.14] px-2 py-0.5 font-mono text-[10.5px] font-semibold text-gold-deep dark:text-gold">
                      {member.memberId}
                    </span>
                  )}
                  {deptName ? (
                    <span className="font-ethiopic text-[11px] text-muted-foreground">
                      {deptName} ክፍል
                    </span>
                  ) : (
                    <span className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                      {roleStyle.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Ornament rule */}
            <div className="flex items-center gap-2.5">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-parchment-edge dark:to-ink-muted/40" />
              <span className="flex items-center gap-1">
                <span className="h-[3px] w-[3px] rounded-full bg-gold opacity-40" />
                <span className="h-[3px] w-[3px] rounded-full bg-gold" />
                <span className="h-[3px] w-[3px] rounded-full bg-gold opacity-40" />
              </span>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-parchment-edge dark:to-ink-muted/40" />
            </div>

            {/* Fields */}
            <div className="mt-5 grid grid-cols-2 gap-3.5">
              <div>
                <Label
                  htmlFor="desk-display-name"
                  className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold"
                >
                  Full name
                </Label>
                <Input
                  id="desk-display-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-[10px] border border-border bg-card text-[13px] text-foreground focus-visible:ring-2 focus-visible:ring-gold/30"
                />
              </div>
              <div>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                  Phone
                </div>
                <div className="rounded-[10px] border border-border bg-card px-3.5 py-[9px] font-mono text-[13px] text-foreground">
                  {member?.addressPhone || '—'}
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                  Department
                </div>
                <div className="rounded-[10px] border border-border bg-card px-3.5 py-[9px] text-[13px] text-foreground">
                  {deptName || '—'}
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                  Member since
                </div>
                <div className="rounded-[10px] border border-border bg-card px-3.5 py-[9px] font-mono text-[13px] text-foreground">
                  —
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving || name === displayName}
                className="sacred-gradient inline-flex items-center gap-2 rounded-[10px] border border-gold/40 px-4 py-2.5 text-[13px] font-semibold text-cream shadow-fy-sm transition-opacity hover:opacity-95 disabled:opacity-60"
              >
                <Pencil className="h-3.5 w-3.5 text-gold" />
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
              <Button
                asChild
                variant="outline"
                className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-card px-4 py-2.5 text-[13px] font-semibold text-burgundy hover:bg-card/80 dark:text-gold"
              >
                <Link href="/forgot-password">
                  <KeyRound className="h-3.5 w-3.5" />
                  Change password
                </Link>
              </Button>
            </div>
          </div>

          {/* QR card */}
          <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-fy-sm">
            <div className="font-ethiopic text-xs font-medium tracking-[0.06em] text-gold-deep dark:text-gold">
              የመግቢያ ኮድ
            </div>
            <h3 className="mt-0.5 font-display text-[22px] font-medium text-burgundy-ink dark:text-cream">
              Check-in code
            </h3>
            {member ? (
              <>
                <div className="mx-auto mt-4 w-fit rounded-[14px] border border-border bg-parchment-soft p-3 shadow-[0_8px_20px_-12px_rgba(74,14,24,0.35)]">
                  <MemberQR value={member.memberId} size={168} />
                </div>
                <div className="mt-3 font-mono text-[13px] tracking-[0.08em] text-foreground">
                  {member.memberId}
                </div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
                  Show this code at the door to check in.
                </p>
                <div className="mt-3.5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 rounded-[10px] border border-border bg-card px-4 py-2 text-[12.5px] font-semibold text-burgundy hover:bg-card/80 dark:text-gold"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print card
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">
                Link your member profile to get a check-in QR code.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
