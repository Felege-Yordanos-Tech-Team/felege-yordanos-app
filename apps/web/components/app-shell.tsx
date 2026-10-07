import type { Role as UserRole } from '@felege-yordanos/db/schema';
import { BottomNav } from './bottom-nav';
import { MobileHeader } from './mobile-header';
import { SidebarProvider } from './sidebar/sidebar-provider';
import { SidebarNav } from './sidebar/sidebar-nav';
import { TopBar } from './top-bar';

interface AppShellProps {
  role: UserRole;
  displayName: string;
  children: React.ReactNode;
}

/**
 * The responsive frame shared by the (member) and (admin) route groups.
 * Presentation only; auth stays in each layout.
 */
export function AppShell({ role, displayName, children }: AppShellProps) {
  return (
    <SidebarProvider>
      {/* Phones: the whole frame (header included) is at least the visible
          screen height (dvh), so short pages do not scroll. */}
      <div className="parchment-bg min-h-dvh md:flex">
        <SidebarNav role={role} displayName={displayName} />
        <div className="md:flex md:h-screen md:min-w-0 md:flex-1 md:flex-col">
          <TopBar displayName={displayName} role={role} />
          <MobileHeader displayName={displayName} role={role} />
          <main className="pb-24 md:min-h-0 md:flex-1 md:overflow-y-auto md:pb-0">{children}</main>
        </div>
      </div>
      <BottomNav role={role} />
    </SidebarProvider>
  );
}
