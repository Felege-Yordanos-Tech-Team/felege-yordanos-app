import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { BottomNav } from '@felege-yordanos/ui';
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

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .single();

  const profile = data as Profile | null;
  const displayName = profile?.display_name || user?.email || 'User';
  const role = profile?.role ?? 'member';

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-50 flex items-center justify-between bg-[#601924] px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/ss-logo.png" alt="" className="h-8 w-8 rounded-full border border-[#735c00]/30" />
          <span className="font-headline text-lg text-[#fef9ea]">ፈለገ ዮርዳኖስ</span>
        </div>
        <UserMenu displayName={displayName} />
      </header>
      {children}
      <BottomNav role={role} />
    </div>
  );
}
