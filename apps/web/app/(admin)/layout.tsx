import { BottomNav } from '@felege-yordanos/ui';
import { LogoutButton } from '@/components/logout-button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-16">
      <header className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium">ፈለገ ዮርዳኖስ</span>
        <LogoutButton />
      </header>
      {children}
      <BottomNav role="admin" />
    </div>
  );
}
