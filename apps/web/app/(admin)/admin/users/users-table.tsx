'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { departments, Role } from '@felege-yordanos/db/schema';
import { ChevronRight, MoreHorizontal, Plus, Search } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateUserRole } from './actions';

type UserRole = Role;
type Department = Pick<typeof departments.$inferSelect, 'id' | 'nameAm'>;

interface ProfileRow {
  id: string;
  displayName: string | null;
  /** Login email (auth_users), shown as the secondary identifier. */
  email: string | null;
  role: UserRole;
  departmentId: number | null;
}

interface UsersTableProps {
  profiles: ProfileRow[];
  departments: Department[];
}

const ROLE_STYLES: Record<
  UserRole,
  { bg: string; text: string; label: string }
> = {
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

const ROLES: UserRole[] = ['member', 'dept_head', 'admin', 'super_admin'];

const ROLE_FILTERS: { value: 'all' | UserRole; label: string }[] = [
  { value: 'all', label: 'All roles' },
  { value: 'dept_head', label: 'Dept heads' },
  { value: 'admin', label: 'Admins' },
  { value: 'member', label: 'Members' },
];

function getInitials(p: ProfileRow): string {
  const name = p.displayName || p.email || p.id;
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((w) => w[0]?.toUpperCase() ?? '').join('') || '··';
}

export function UsersTable({ profiles, departments }: UsersTableProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [selected, setSelected] = useState<ProfileRow | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('member');
  const [editDeptId, setEditDeptId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    const name = (p.displayName || '').toLowerCase();
    const email = (p.email || '').toLowerCase();
    return (
      !search || name.includes(q) || email.includes(q) || p.id.includes(search)
    );
  });

  const deskFiltered =
    roleFilter === 'all'
      ? profiles
      : profiles.filter((p) => p.role === roleFilter);

  function getDeptName(deptId: number | null): string {
    if (deptId == null) return '—';
    return departments.find((d) => d.id === deptId)?.nameAm ?? '—';
  }

  function openEditor(profile: ProfileRow) {
    setSelected(profile);
    setEditRole(profile.role);
    setEditDeptId(profile.departmentId ? String(profile.departmentId) : '');
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    const res = await updateUserRole({
      userId: selected.id,
      role: editRole,
      departmentId:
        editRole === 'dept_head' && editDeptId ? Number(editDeptId) : null,
    });
    setSaving(false);
    if (!res.ok) {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    } else {
      toast({
        title: 'Updated',
        description: `${selected.displayName || selected.email || 'User'} is now ${editRole.replace('_', ' ')}.`,
      });
      setSelected(null);
      router.refresh();
    }
  }

  return (
    <>
      {/* ─── MOBILE (< md) — search + list ─── */}
      <div className="md:hidden">
        {/* Search */}
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-[10px] border border-border bg-card pl-[34px] text-[12.5px] placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-gold/30"
          />
        </div>

        {/* Role legend */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ROLES.map((r) => {
            const s = ROLE_STYLES[r];
            return (
              <span
                key={r}
                className={`rounded-full px-2.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.04em] ${s.bg} ${s.text}`}
              >
                {s.label}
              </span>
            );
          })}
        </div>

        {/* User list */}
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No users found
            </p>
          ) : (
            filtered.map((p, i) => {
              const s = ROLE_STYLES[p.role];
              const dept =
                p.role === 'dept_head' ? getDeptName(p.departmentId) : null;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => openEditor(p)}
                  className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-card/80 ${
                    i < filtered.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-[13px] font-bold text-burgundy-deep"
                    style={{
                      background: 'linear-gradient(135deg, #D4A843, #A47A18)',
                    }}
                  >
                    {getInitials(p)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold leading-tight text-foreground">
                      {p.displayName || p.email || p.id.slice(0, 8)}
                    </div>
                    {p.displayName && p.email && (
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {p.email}
                      </div>
                    )}
                    {dept && dept !== '—' && (
                      <div className="mt-0.5 font-ethiopic text-[11px] text-muted-foreground">
                        {dept}
                      </div>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.04em] ${s.bg} ${s.text}`}
                  >
                    {s.label}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── DESKTOP (md+) — header + role pills + table ─── */}
      <div className="hidden md:block">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="font-ethiopic text-xs text-gold-deep dark:text-gold">
              የተጠቃሚ አስተዳደር
            </div>
            <h1 className="mt-0.5 font-display text-[30px] font-medium leading-[1.05] text-burgundy-ink dark:text-cream">
              Manage users
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Roles and department assignments
            </p>
          </div>
          <button
            type="button"
            disabled
            className="sacred-gradient inline-flex items-center gap-1.5 rounded-xl border border-gold/40 px-4 py-2 text-sm font-semibold text-cream shadow-fy-md disabled:opacity-95"
          >
            <Plus className="h-4 w-4 text-gold" />
            Invite
          </button>
        </div>

        {/* Role filter pills */}
        <div className="mb-4 flex gap-1.5">
          {ROLE_FILTERS.map((f) => {
            const active = roleFilter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setRoleFilter(f.value)}
                className={`rounded-full px-3.5 py-1.5 text-[11px] transition-colors ${
                  active
                    ? 'bg-burgundy font-semibold text-cream'
                    : 'border border-border bg-card font-medium text-foreground hover:bg-card/80'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-fy-sm">
          <div className="grid grid-cols-[1.4fr_150px_160px_100px_30px] gap-3 border-b border-parchment-edge px-1 pb-2.5 dark:border-ink-muted/40">
            {['Member', 'Role', 'Department', 'ID', ''].map((h, i) => (
              <span
                key={i}
                className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold"
              >
                {h}
              </span>
            ))}
          </div>
          {deskFiltered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No users found
            </p>
          ) : (
            deskFiltered.map((p) => {
              const s = ROLE_STYLES[p.role];
              const dept =
                p.role === 'dept_head' ? getDeptName(p.departmentId) : '—';
              const isSuper = p.role === 'super_admin';
              return (
                <div
                  key={p.id}
                  className="grid grid-cols-[1.4fr_150px_160px_100px_30px] items-center gap-3 border-b border-border px-1 py-3 last:border-0"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-[11px] font-bold ${
                        isSuper
                          ? 'text-burgundy-deep'
                          : 'bg-parchment-deep text-burgundy dark:bg-gold/[0.14] dark:text-gold'
                      }`}
                      style={
                        isSuper
                          ? {
                              background:
                                'linear-gradient(135deg, #D4A843, #A47A18)',
                            }
                          : undefined
                      }
                    >
                      {getInitials(p)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-foreground">
                        {p.displayName || p.email || p.id.slice(0, 8)}
                      </div>
                      {p.displayName && p.email && (
                        <div className="truncate text-[11px] text-muted-foreground">
                          {p.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className={`w-fit rounded-full px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em] ${s.bg} ${s.text}`}
                  >
                    {s.label}
                  </span>
                  <span
                    className={
                      dept === '—'
                        ? 'text-[12px] text-ink-faint'
                        : 'font-ethiopic text-[11.5px] text-foreground'
                    }
                  >
                    {dept}
                  </span>
                  <span className="font-mono text-[10.5px] text-muted-foreground">
                    {p.id.slice(0, 8)}
                  </span>
                  <button
                    type="button"
                    onClick={() => openEditor(p)}
                    className="flex h-[26px] w-[26px] items-center justify-center rounded-md text-ink-faint hover:text-foreground"
                    aria-label="Edit user"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Sheet */}
      <Sheet
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="font-display text-xl">
              Edit user role
            </SheetTitle>
            <SheetDescription>
              {selected?.displayName || selected?.email || 'User'}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                Role
              </Label>
              <Select
                value={editRole}
                onValueChange={(v) => {
                  setEditRole(v as UserRole);
                  if (v !== 'dept_head') setEditDeptId('');
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editRole === 'dept_head' && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                  Department
                </Label>
                <Select value={editDeptId} onValueChange={setEditDeptId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.nameAm}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={saving}
              className="sacred-gradient mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 py-3 text-sm font-semibold text-cream shadow-fy-md hover:opacity-95"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
