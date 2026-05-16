import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { redirect } from 'next/navigation';
import { BottomNav } from '@felege-yordanos/ui';
import { UserMenu } from '@/components/user-menu';
import { Badge } from '@/components/ui/badge';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .single();

  const profile = data as Profile | null;
  const role = profile?.role ?? 'member';

  if (role === 'member') {
    redirect('/dashboard');
  }

  const displayName = profile?.display_name || user?.email || 'User';

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-50 flex items-center justify-between bg-burgundy px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/ss-logo.png" alt="" className="h-8 w-8 rounded-full border border-gold/30" />
          <span className="font-ethiopic text-lg font-semibold text-cream">ፈለገ ዮርዳኖስ</span>
          <Badge className="border border-gold/30 bg-gold/15 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">
            {role.replace('_', ' ')}
          </Badge>
        </div>
        <UserMenu displayName={displayName} />
      </header>
      {children}
      <BottomNav role={role} />
    </div>
  );
}
