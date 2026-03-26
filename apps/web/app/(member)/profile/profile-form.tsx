'use client';

import { useState } from 'react';
import { createClient } from '@felege-yordanos/db';
import type { UserRole } from '@felege-yordanos/db';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ProfileFormProps {
  profileId: string;
  email: string;
  displayName: string;
  role: UserRole;
}

const roleBadgeVariant: Record<UserRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  member: 'secondary',
  dept_head: 'outline',
  admin: 'default',
  super_admin: 'destructive',
};

export function ProfileForm({ profileId, email, displayName, role }: ProfileFormProps) {
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
    <Card className="mt-6">
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
  );
}
