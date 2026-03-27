import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { SongsTable } from './songs-table';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Song = Database['public']['Tables']['songs']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

function canManageSongs(profile: Profile | null): boolean {
  if (!profile) return false;
  if (profile.role === 'admin' || profile.role === 'super_admin') return true;
  if (profile.role === 'dept_head' && String(profile.department_id) === '6') return true;
  return false;
}

export default async function ManageSongsPage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .single();

  const profile = profileData as Profile | null;

  if (!canManageSongs(profile)) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card>
          <CardHeader className="text-center">
            <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
            <CardTitle className="mt-2">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              Only admins and Songs & Celebrations department heads can manage songs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [{ data: songs }, { data: categories }] = await Promise.all([
    supabase.from('songs').select('*').order('number'),
    supabase.from('categories').select('*').order('sort_order'),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <span className="text-secondary font-label text-[10px] tracking-widest uppercase block mb-1">መዝሙር አስተዳደር</span>
      <h1 className="font-headline text-3xl text-primary">Manage Songs</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Add, edit, and organize songs and categories
      </p>
      <SongsTable
        songs={(songs as Song[]) ?? []}
        categories={(categories as Category[]) ?? []}
      />
    </div>
  );
}
