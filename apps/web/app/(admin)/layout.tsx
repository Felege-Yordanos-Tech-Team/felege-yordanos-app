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
      <header className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">ፈለገ ዮርዳኖስ</span>
          <Badge variant="outline" className="text-xs">
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
