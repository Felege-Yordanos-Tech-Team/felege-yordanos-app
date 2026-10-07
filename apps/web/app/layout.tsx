import './global.css';
// Fonts are bundled with the app (no Google Fonts request at runtime).
import '@fontsource/noto-serif-ethiopic/400.css';
import '@fontsource/noto-serif-ethiopic/500.css';
import '@fontsource/noto-serif-ethiopic/600.css';
import '@fontsource/noto-serif-ethiopic/700.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import type { Metadata, Viewport } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/providers';
import { getLocale } from '@/lib/i18n/server';

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
  themeColor: '#0C453D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-dvh font-body antialiased">
        <Providers locale={locale}>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
