'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@felege-yordanos/db';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Link2 } from 'lucide-react';
import Link from 'next/link';

interface ClaimFormProps {
  authUserId: string;
}

export function ClaimForm({ authUserId }: ClaimFormProps) {
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();

    // 1. Look up the member by member_id
    const { data: member, error: lookupError } = await supabase
      .from('members')
      .select('*')
      .eq('member_id', memberId.trim())
      .single() as { data: { id: number; auth_user_id: string | null; name: string; father_name: string | null } | null; error: unknown };

    if (lookupError || !member) {
      setError('Member ID not found. Please check your ID and try again.');
      setLoading(false);
      return;
    }

    // 2. Check if already claimed
    if (member.auth_user_id) {
      setError(
        'This member ID is already linked to another account. Contact an admin.'
      );
      setLoading(false);
      return;
    }

    // 3. Claim: set auth_user_id
    const { error: claimError } = await supabase
      .from('members')
      .update({ auth_user_id: authUserId } as never)
      .eq('id', member.id);

    if (claimError) {
      setError('Failed to link your profile. Please try again.');
      setLoading(false);
      return;
    }

    // 4. Update display_name in profiles
    const fullName = [member.name, member.father_name]
      .filter(Boolean)
      .join(' ');

    if (fullName) {
      await supabase
        .from('profiles')
        .update({ display_name: fullName } as never)
        .eq('id', authUserId);
    }

    setLoading(false);
    toast({
      title: 'Profile linked!',
      description: `Welcome, ${fullName || 'member'}!`,
    });
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          <CardTitle>Link Your Member Profile</CardTitle>
        </div>
        <CardDescription>
          የአባልነት መለያዎን ያገናኙ
        </CardDescription>
        <p className="text-sm text-muted-foreground">
          Enter your Sunday School member ID to connect your account with
          your existing member record.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleClaim} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member-id">Member ID</Label>
            <Input
              id="member-id"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              placeholder="e.g. ssu/01/03/05/0578"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Linking...' : 'Claim Profile'}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">Skip for now</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
