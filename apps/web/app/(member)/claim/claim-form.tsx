'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { claimMember } from './actions';

export function ClaimForm() {
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    let res: Awaited<ReturnType<typeof claimMember>>;
    try {
      res = await claimMember(memberId);
    } catch {
      setError('Failed to link your profile. Please try again.');
      setLoading(false);
      return;
    }

    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }

    const fullName = res.data.displayName;

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
        <CardDescription>የአባልነት መለያዎን ያገናኙ</CardDescription>
        <p className="text-sm text-muted-foreground">
          Enter your Sunday School member ID to connect your account with your
          existing member record.
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
          {error && <p className="text-sm text-destructive">{error}</p>}
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
