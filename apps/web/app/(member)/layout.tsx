import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { AppShell } from '@/components/app-shell';
import { UserMenu } from '@/components/user-menu';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const profile = data as Profile | null;
  const displayName = profile?.display_name || user?.email || 'User';
  const role = profile?.role ?? 'member';

  const mobileHeader = (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-[#601924] px-4 py-3 shadow-sm md:hidden">
      <div className="flex items-center gap-3">
        <img src="/ss-logo.png" alt="" className="h-8 w-8 rounded-full border border-[#735c00]/30" />
        <span className="font-headline text-lg text-[#fef9ea]">ፈለገ ዮርዳኖስ</span>
      </div>
      <UserMenu displayName={displayName} />
    </header>
  );

  return (
    <AppShell role={role} displayName={displayName} mobileHeader={mobileHeader}>
      {children}
    </AppShell>
  );
}
