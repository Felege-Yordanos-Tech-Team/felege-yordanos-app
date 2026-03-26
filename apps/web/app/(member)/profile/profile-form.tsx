'use client';

import { useState } from 'react';
import { createClient } from '@felege-yordanos/db';
import type { UserRole, Member } from '@felege-yordanos/db';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Link2 } from 'lucide-react';
import Link from 'next/link';

interface ProfileFormProps {
  profileId: string;
  email: string;
  displayName: string;
  role: UserRole;
  member: Member | null;
}

const roleBadgeVariant: Record<UserRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  member: 'secondary',
  dept_head: 'outline',
  admin: 'default',
  super_admin: 'destructive',
};

export function ProfileForm({ profileId, email, displayName, role, member }: ProfileFormProps) {
  const [name, setName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: name } as never)
      .eq('id', profileId);

    setSaving(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Saved',
        description: 'Your profile has been updated.',
      });
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <Badge variant={roleBadgeVariant[role]} className="w-fit">
            {role.replace('_', ' ')}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <p className="text-sm text-muted-foreground">
              Your role is managed by administrators and cannot be changed here.
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || name === displayName}
            className="w-full"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Member Record</Label>
          </div>
        </CardHeader>
        <CardContent>
          {member ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Member ID</Label>
                <Badge variant="outline">{member.member_id}</Badge>
              </div>
              <Separator />
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                <p className="text-sm font-medium">
                  {[member.name, member.father_name, member.grandfather_name]
                    .filter(Boolean)
                    .join(' ')}
                </p>
              </div>
              {member.gender && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Gender</Label>
                  <p className="text-sm">{member.gender}</p>
                </div>
              )}
              {member.address_phone && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="text-sm">{member.address_phone}</p>
                </div>
              )}
              {member.status && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge variant="secondary">{member.status}</Badge>
                </div>
              )}
              <p className="text-xs text-muted-foreground pt-2">
                Member record information is read-only. Contact an admin to update.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Your account is not linked to a member record yet.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/claim">Link Member Profile</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
