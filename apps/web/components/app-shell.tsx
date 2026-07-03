import type { UserRole } from '@felege-yordanos/db';
import { BottomNav } from '@felege-yordanos/ui';
import { SidebarProvider } from './sidebar/sidebar-provider';
import { SidebarNav } from './sidebar/sidebar-nav';
import { TopBar } from './top-bar';

interface AppShellProps {
  role: UserRole;
  displayName: string;
  /**
   * The existing mobile header, supplied by each route group so its exact
   * markup (e.g. the admin role badge) is preserved. It carries its own
   * `md:hidden` — desktop uses the TopBar instead.
   */
  mobileHeader: React.ReactNode;
  children: React.ReactNode;
}

/**
 * The responsive frame shared by the (member) and (admin) route groups.
 *
 * Presentation only — auth and redirects stay in each layout. Below `md` the
 * markup is the original mobile shell (header + bottom nav); at `md`+ the
 * sidebar and top bar appear and the bottom nav is hidden. Everything desktop
 * is additive via `md:`/`lg:` prefixes, so the mobile view is unchanged.
 */
export function AppShell({
  role,
  displayName,
  mobileHeader,
  children,
}: AppShellProps) {
  return (
    <SidebarProvider>
      <div className="md:flex">
        <SidebarNav role={role} displayName={displayName} />
        <div className="md:min-w-0 md:flex-1">
          <TopBar displayName={displayName} role={role} />
          {mobileHeader}
          <main className="min-h-screen pb-16 md:min-h-[calc(100vh-4rem)] md:pb-0">
            {children}
          </main>
        </div>
      </div>
      {/* Bottom nav: mobile only (the sidebar replaces it on desktop). */}
      <div className="md:hidden">
        <BottomNav role={role} />
      </div>
    </SidebarProvider>
  );
}
