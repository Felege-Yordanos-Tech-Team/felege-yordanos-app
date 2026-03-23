import { BottomNav } from '@felege-yordanos/ui';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-16">
      {children}
      <BottomNav role="admin" />
    </div>
  );
}
