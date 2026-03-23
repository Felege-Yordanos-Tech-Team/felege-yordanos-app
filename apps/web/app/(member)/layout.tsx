import { BottomNav } from '@felege-yordanos/ui';

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-16">
      {children}
      <BottomNav role="member" />
    </div>
  );
}
