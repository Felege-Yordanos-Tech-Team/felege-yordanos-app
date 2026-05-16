import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { SongsTable } from './songs-table';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Song = Database['public']['Tables']['songs']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

function canManageSongs(profile: Profile | null): boolean {
  if (!profile) return false;
  if (profile.role === 'admin' || profile.role === 'super_admin') return true;
  if (profile.role === 'dept_head' && profile.department_id === 6) return true;
  return false;
}

export default async function ManageSongsPage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .single();

  const profile = profileData as Profile | null;

  if (!canManageSongs(profile)) {
    return (
      <div className="mx-auto max-w-md px-[22px] py-16">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h2 className="mt-2 font-display text-2xl font-medium text-burgundy-ink dark:text-cream">
            Access denied
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Only admins and Songs &amp; Celebrations department heads can manage songs.
          </p>
        </div>
      </div>
    );
  }

  const [{ data: songs }, { data: categories }] = await Promise.all([
    supabase.from('songs').select('*').order('number'),
    supabase.from('categories').select('*').order('sort_order'),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-[22px] pb-6 pt-4">
      <Link
        href="/admin"
        className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep transition-colors hover:text-burgundy dark:text-gold dark:hover:text-gold-light"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Admin panel
      </Link>

      <div className="font-ethiopic text-xs font-medium tracking-[0.06em] text-gold-deep dark:text-gold">
        መዝሙር አስተዳደር
      </div>
      <h1 className="mt-0.5 font-display text-[28px] font-medium leading-[1.05] text-burgundy-ink dark:text-cream">
        Songs &amp; categories
      </h1>

      <SongsTable
        songs={(songs as Song[]) ?? []}
        categories={(categories as Category[]) ?? []}
      />
    </div>
  );
}
