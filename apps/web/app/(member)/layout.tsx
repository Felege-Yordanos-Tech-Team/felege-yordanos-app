import { AppShell } from '@/components/app-shell';
import { UserMenu } from '@/components/user-menu';
import { requireUser } from '@/lib/session';

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { displayName, role } = await requireUser();

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
