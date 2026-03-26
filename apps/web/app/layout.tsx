import './global.css';
import type { Metadata, Viewport } from 'next';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: '\u134D\u1208\u1308 \u12EE\u122D\u12F3\u1296\u1235 \u1230\u1295\u1260\u1275 \u1275/\u1264\u1275',
  description: 'Felege Yordanos Sunday School App',
};

export const viewport: Viewport = {
  themeColor: '#1e40af',
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
