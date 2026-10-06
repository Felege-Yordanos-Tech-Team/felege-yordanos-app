import { AppShell } from '@/components/app-shell';
import { requireRole } from '@/lib/session';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Members are sent back to the dashboard. Each admin page still checks
  // the exact roles and departments it allows.
  const { displayName, role } = await requireRole(['dept_head', 'admin', 'super_admin']);
  return (
    <AppShell role={role} displayName={displayName}>
      {children}
    </AppShell>
  );
}
