export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen pt-[env(safe-area-inset-top,0px)]">{children}</div>;
}
