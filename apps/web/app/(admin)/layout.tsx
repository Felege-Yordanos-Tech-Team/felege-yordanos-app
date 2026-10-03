import { AppShell } from '@/components/app-shell';
import { UserMenu } from '@/components/user-menu';
import { Badge } from '@/components/ui/badge';
import { requireRole } from '@/lib/session';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Members are sent back to the dashboard. Each admin page still checks
  // the exact roles and departments it allows.
  const { displayName, role } = await requireRole(['dept_head', 'admin', 'super_admin']);

  const mobileHeader = (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-burgundy px-4 py-3 shadow-sm md:hidden">
      <div className="flex items-center gap-3">
        <img src="/ss-logo.png" alt="" className="h-8 w-8 rounded-full border border-gold/30" />
        <span className="font-ethiopic text-lg font-semibold text-cream">ፈለገ ዮርዳኖስ</span>
        <Badge className="border border-gold/30 bg-gold/15 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">
          {role.replace('_', ' ')}
        </Badge>
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
