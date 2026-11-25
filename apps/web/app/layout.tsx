import './global.css';
// Fonts are bundled with the app (no Google Fonts request at runtime).
// Amharic: Noto Sans Ethiopic, Ethiopic subset only (Latin comes from Inter).
import '@fontsource/noto-sans-ethiopic/ethiopic-400.css';
import '@fontsource/noto-sans-ethiopic/ethiopic-500.css';
import '@fontsource/noto-sans-ethiopic/ethiopic-600.css';
import '@fontsource/noto-sans-ethiopic/ethiopic-700.css';
// English: Inter (variable, all weights).
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
  // Real safe-area insets on iOS (notch, home indicator, rounded corners).
  // Every edge that can touch the screen pads itself with env(safe-area-inset-*).
  viewportFit: 'cover',
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
