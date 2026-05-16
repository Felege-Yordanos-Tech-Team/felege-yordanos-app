'use client';

import { useState } from 'react';
import { createClient } from '@felege-yordanos/db';
import type { UserRole, Department } from '@felege-yordanos/db';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useRouter } from 'next/navigation';

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

const roleBadgeVariant: Record<UserRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  member: 'secondary',
  dept_head: 'outline',
  admin: 'default',
  super_admin: 'destructive',
};

const roles: UserRole[] = ['member', 'dept_head', 'admin', 'super_admin'];

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
    const dept = departments.find((d) => d.id === deptId);
    return dept?.name_am ?? '—';
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
    const update: Record<string, unknown> = {
      role: editRole,
      department_id: editRole === 'dept_head' && editDeptId ? Number(editDeptId) : null,
    };

    const { error } = await supabase
      .from('profiles')
      .update(update as never)
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
      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="mt-4 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden sm:table-cell">Department</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => openEditor(p)}
                >
                  <TableCell className="font-medium">
                    {p.display_name || p.full_name || p.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariant[p.role]} className="text-xs">
                      {p.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {getDeptName(p.department_id)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit User Role</SheetTitle>
            <SheetDescription>
              {selected?.display_name || selected?.full_name || 'User'}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={(v) => {
                setEditRole(v as UserRole);
                if (v !== 'dept_head') setEditDeptId('');
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editRole === 'dept_head' && (
              <div className="space-y-2">
                <Label>Department</Label>
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
              className="w-full"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
