import { AppShell } from '@/components/app-shell';
import { requireUser } from '@/lib/session';

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const { displayName, role } = await requireUser();
  return (
    <AppShell role={role} displayName={displayName}>
      {children}
    </AppShell>
  );
}
