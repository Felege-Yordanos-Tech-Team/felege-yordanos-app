import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { BottomNav } from '@felege-yordanos/ui';
import { UserMenu } from '@/components/user-menu';

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
  const displayName = profile?.display_name || user?.email || 'User';
  const role = profile?.role ?? 'member';

  return (
    <div className="min-h-screen pb-16">
      <header className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium">ፈለገ ዮርዳኖስ</span>
        <UserMenu displayName={displayName} />
      </header>
      {children}
      <BottomNav role={role} />
    </div>
  );
}
