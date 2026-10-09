'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { departments, Role } from '@felege-yordanos/db/schema';
import { ChevronRight, MoreHorizontal, Search } from 'lucide-react';
import { Card, Chip } from '@/components/ds';
import { roleLabel } from '@/components/role-badge';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLocale, useT } from '@/lib/i18n/client';
import { cn } from '@/lib/utils';
import { updateUserRole } from './actions';
import { initialsOf, ROLE_ORDER, RolePill } from '@/components/role-pill';

type UserRole = Role;
type Department = Pick<
  typeof departments.$inferSelect,
  'id' | 'nameAm' | 'nameEn'
>;

interface ProfileRow {
  id: string;
  displayName: string | null;
  /** Login email (auth_users), shown as the secondary identifier. */
  email: string | null;
  role: UserRole;
  departmentId: number | null;
  /** Linked member record code (e.g. FY-0247), if the account is linked. */
  memberCode: string | null;
}

interface UsersTableProps {
  profiles: ProfileRow[];
  departments: Department[];
}

const ROLE_FILTERS: { value: 'all' | UserRole; label: string }[] = [
  { value: 'all', label: 'All roles' },
  { value: 'dept_head', label: 'Dept heads' },
  { value: 'admin', label: 'Admins' },
  { value: 'member', label: 'Members' },
];

// Desktop table columns.
const COLS = 'grid grid-cols-[minmax(0,1.4fr)_150px_160px_100px_30px] gap-3';

const SEARCH_INPUT =
  'h-auto rounded-[10px] border border-solid border-parchment-edge bg-parchment-soft py-[9px] pl-[34px] pr-3 text-[12.5px] text-ink md:text-[12.5px] placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-gold/30';

const FIELD_LABEL =
  'block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep';

const SELECT_TRIGGER =
  'h-auto rounded-[10px] border-parchment-edge bg-parchment-soft px-3.5 py-[11px] text-[13px] text-ink dark:bg-parchment-deep';

export function UsersTable({ profiles, departments }: UsersTableProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [selected, setSelected] = useState<ProfileRow | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('member');
  const [editDeptId, setEditDeptId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const t = useT();
  const locale = useLocale();

  const matchesSearch = (p: ProfileRow) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const name = (p.displayName || '').toLowerCase();
    const email = (p.email || '').toLowerCase();
    return (
      name.includes(q) ||
      email.includes(q) ||
      p.id.includes(q) ||
      (p.memberCode ?? '').toLowerCase().includes(q)
    );
  };

  const filtered = profiles.filter(matchesSearch);
  const deskFiltered = filtered.filter(
    (p) => roleFilter === 'all' || p.role === roleFilter,
  );

  function getDeptName(deptId: number | null): string | null {
    if (deptId == null) return null;
    const d = departments.find((x) => x.id === deptId);
    return d ? (locale === 'am' ? d.nameAm : d.nameEn) : null;
  }

  function nameOf(p: ProfileRow): string {
    return p.displayName || p.email || p.id.slice(0, 8);
  }

  function openEditor(profile: ProfileRow) {
    setSelected(profile);
    setEditRole(profile.role);
    setEditDeptId(profile.departmentId ? String(profile.departmentId) : '');
  }

  async function handleSave() {
    if (
      !selected ||
      saving ||
      (editRole === 'dept_head' && !editDeptId)
    ) {
      return;
    }
    setSaving(true);
    const res = await updateUserRole({
      userId: selected.id,
      role: editRole,
      departmentId:
        editRole === 'dept_head' && editDeptId ? Number(editDeptId) : null,
    });
    setSaving(false);
    if (!res.ok) {
      toast({
        title: t('Error'),
        description: t(res.error),
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('Updated'),
        description: t('{name} is now {role}.', {
          name: selected.displayName || selected.email || t('User'),
          role: roleLabel(editRole, t),
        }),
      });
      setSelected(null);
      router.refresh();
    }
  }

  const empty = (
    <p className="py-8 text-center text-sm text-ink-muted">
      {t('No users found')}
    </p>
  );

  return (
    <>
      {/* ─── PHONE (< md): search + role legend + list ─── */}
      <div className="md:hidden">
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-[1] h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <Input
            type="search"
            aria-label={t('Search users')}
            placeholder={t('Search by name or email…')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={SEARCH_INPUT}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {ROLE_ORDER.map((r) => (
            <RolePill key={r} role={r} t={t} variant="list" />
          ))}
        </div>

        <div className="mt-3.5 overflow-hidden rounded-xl border border-parchment-edge bg-parchment-soft">
          {filtered.length === 0
            ? empty
            : filtered.map((p) => {
                const dept =
                  p.role === 'dept_head' ? getDeptName(p.departmentId) : null;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openEditor(p)}
                    className="flex w-full items-center gap-3 border-b border-parchment-edge px-3.5 py-[11px] text-left transition-colors last:border-b-0 hover:bg-parchment-deep/50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-deep font-display text-[13px] font-bold text-brand-deep">
                      {initialsOf(p.displayName, p.email)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold leading-[1.15] text-ink">
                        {nameOf(p)}
                      </div>
                      {p.displayName && p.email && (
                        <div className="mt-0.5 truncate text-[11px] text-ink-muted">
                          {p.email}
                        </div>
                      )}
                      {dept && (
                        <div className="mt-px font-ethiopic text-[11px] text-ink-muted">
                          {dept}
                        </div>
                      )}
                    </div>
                    <RolePill role={p.role} t={t} variant="list" />
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                  </button>
                );
              })}
        </div>
      </div>

      {/* ─── DESKTOP (md+): role chips + search + table ─── */}
      <div className="hidden md:block">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {ROLE_FILTERS.map((f) => (
              <Chip
                key={f.value}
                active={roleFilter === f.value}
                onClick={() => setRoleFilter(f.value)}
                aria-pressed={roleFilter === f.value}
                className="px-[13px]"
              >
                {t(f.label)}
              </Chip>
            ))}
          </div>
          <div className="relative ml-auto w-[260px] shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-[1] h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
            <Input
              type="search"
              aria-label={t('Search users')}
              placeholder={t('Search by name or email…')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={SEARCH_INPUT}
            />
          </div>
        </div>

        <Card className="p-[22px]">
          <div
            className={cn(
              COLS,
              'border-b border-parchment-edge-strong px-1 pb-[9px]',
            )}
          >
            {['Member', 'Role', 'Department', 'ID', ''].map((h, i) => (
              <span
                key={i}
                className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gold-deep"
              >
                {h && t(h)}
              </span>
            ))}
          </div>
          {deskFiltered.length === 0
            ? empty
            : deskFiltered.map((p) => {
                const dept =
                  p.role === 'dept_head' ? getDeptName(p.departmentId) : null;
                const isSuper = p.role === 'super_admin';
                return (
                  <div
                    key={p.id}
                    className={cn(
                      COLS,
                      'items-center border-b border-parchment-edge px-1 py-3',
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-[11px] font-bold',
                          isSuper
                            ? 'bg-gradient-to-br from-gold to-gold-deep text-brand-deep'
                            : 'bg-parchment-deep text-brand dark:bg-gold/[0.14] dark:text-gold',
                        )}
                      >
                        {initialsOf(p.displayName, p.email)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium text-ink">
                          {nameOf(p)}
                        </div>
                        {p.displayName && p.email && (
                          <div className="truncate text-[11px] text-ink-muted">
                            {p.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <RolePill role={p.role} t={t} />
                    {dept ? (
                      <span className="truncate font-ethiopic text-[11.5px] text-ink">
                        {dept}
                      </span>
                    ) : (
                      <span className="text-xs text-ink-faint">—</span>
                    )}
                    <span className="font-mono text-[10.5px] text-ink-muted">
                      {p.memberCode ?? '—'}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditor(p)}
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] text-ink-faint transition-colors hover:bg-parchment-deep hover:text-ink"
                      aria-label={t('Edit user')}
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
        </Card>
      </div>

      {/* Role / department editor */}
      <Sheet
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent className="border-parchment-edge bg-parchment-soft">
          <SheetHeader className="text-left">
            <SheetTitle className="font-display text-[22px] font-medium text-brand-ink">
              {t('Edit user role')}
            </SheetTitle>
            <SheetDescription asChild>
              <div className="flex items-center gap-2.5 pt-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-deep font-display text-[13px] font-bold text-brand-deep">
                  {selected
                    ? initialsOf(selected.displayName, selected.email)
                    : ''}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold text-ink">
                    {selected ? nameOf(selected) : t('User')}
                  </div>
                  {selected?.displayName && selected.email && (
                    <div className="truncate text-[11.5px] text-ink-muted">
                      {selected.email}
                    </div>
                  )}
                </div>
              </div>
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className={FIELD_LABEL}>{t('Role')}</label>
              <Select
                value={editRole}
                onValueChange={(v) => {
                  setEditRole(v as UserRole);
                  // Department assignments only apply to department heads.
                  if (v !== 'dept_head') setEditDeptId('');
                }}
              >
                <SelectTrigger
                  aria-label={t('Role')}
                  className={cn(SELECT_TRIGGER, 'capitalize')}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_ORDER.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">
                      {roleLabel(r, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editRole === 'dept_head' && (
              <div className="space-y-1.5">
                <label className={FIELD_LABEL}>{t('Department')}</label>
                <Select value={editDeptId} onValueChange={setEditDeptId}>
                  <SelectTrigger
                    aria-label={t('Department')}
                    aria-required
                    className={cn(SELECT_TRIGGER, 'font-ethiopic')}
                  >
                    <SelectValue placeholder={t('Select department')} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem
                        key={d.id}
                        value={String(d.id)}
                        className="font-ethiopic"
                      >
                        {locale === 'am' ? d.nameAm : d.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || (editRole === 'dept_head' && !editDeptId)}
              className="sacred-gradient mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 py-3 text-[13px] font-semibold tracking-[0.04em] text-cream shadow-fy-md transition-opacity hover:opacity-95 disabled:opacity-60"
            >
              {saving ? t('Saving…') : t('Save changes')}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
