import './global.css';
import type { Metadata, Viewport } from 'next';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'ፈለገ ዮርዳኖስ ሰንበት ት/ቤት',
  description: 'Felege Yordanos Sunday School App — ፈለገ ዮርዳኖስ ሰንበት ት/ቤት',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ፈ.ዮ.',
  },
  icons: {
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#430310',
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
      <body className="min-h-screen font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
