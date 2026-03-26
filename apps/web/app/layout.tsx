import './global.css';
import type { Metadata, Viewport } from 'next';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'ፈለገ ዮርዳኖስ ሰንበት ት/ቤት',
  description: 'Felege Yordanos Sunday School App',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ፈለገ ዮርዳኖስ',
  },
};

export const viewport: Viewport = {
  themeColor: '#1e3a5f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="am">
      <body className="min-h-screen bg-white font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
