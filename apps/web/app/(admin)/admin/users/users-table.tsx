'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@felege-yordanos/db';
import type { UserRole, Department } from '@felege-yordanos/db';
import { ChevronRight, Search } from 'lucide-react';
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

interface ProfileRow {
  id: string;
  display_name: string | null;
  full_name: string | null;
  role: UserRole;
  department_id: number | null;
  created_at: string;
}

interface UsersTableProps {
  profiles: ProfileRow[];
  departments: Department[];
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

const ROLES: UserRole[] = ['member', 'dept_head', 'admin', 'super_admin'];

function getInitials(p: ProfileRow): string {
  const name = p.display_name || p.full_name || p.id;
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((w) => w[0]?.toUpperCase() ?? '').join('') || '··';
}

export function UsersTable({ profiles, departments }: UsersTableProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ProfileRow | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('member');
  const [editDeptId, setEditDeptId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const filtered = profiles.filter((p) => {
    const name = (p.display_name || p.full_name || '').toLowerCase();
    return !search || name.includes(search.toLowerCase()) || p.id.includes(search);
  });

  function getDeptName(deptId: number | null): string {
    if (deptId == null) return '—';
    return departments.find((d) => d.id === deptId)?.name_am ?? '—';
  }

  function openEditor(profile: ProfileRow) {
    setSelected(profile);
    setEditRole(profile.role);
    setEditDeptId(profile.department_id ? String(profile.department_id) : '');
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        role: editRole,
        department_id:
          editRole === 'dept_head' && editDeptId ? Number(editDeptId) : null,
      } as never)
      .eq('id', selected.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: 'Updated',
        description: `${selected.display_name || 'User'} is now ${editRole.replace('_', ' ')}.`,
      });
      setSelected(null);
      router.refresh();
    }
  }

  return (
    <>
      {/* Search */}
      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
        <Input
          placeholder="Search by name…"
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
          <p className="py-8 text-center text-sm text-muted-foreground">No users found</p>
        ) : (
          filtered.map((p, i) => {
            const s = ROLE_STYLES[p.role];
            const dept = p.role === 'dept_head' ? getDeptName(p.department_id) : null;
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
                  style={{ background: 'linear-gradient(135deg, #D4A843, #A47A18)' }}
                >
                  {getInitials(p)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold leading-tight text-foreground">
                    {p.display_name || p.full_name || p.id.slice(0, 8)}
                  </div>
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

      {/* Edit Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="font-display text-xl">Edit user role</SheetTitle>
            <SheetDescription>
              {selected?.display_name || selected?.full_name || 'User'}
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
                        {d.name_am}
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
