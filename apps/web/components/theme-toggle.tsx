'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useT } from '@/lib/i18n/client';
import { cn } from '@/lib/utils';

/** Light / dark switch (remembered per browser by next-themes). */
export function ThemeToggle({ onDark = false, className }: { onDark?: boolean; className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useT();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={t('Toggle theme')}
      title={t(dark ? 'Switch to light mode' : 'Switch to dark mode')}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
        onDark ? 'text-cream/80 hover:bg-cream/10' : 'text-ink-muted hover:bg-parchment-deep',
        className,
      )}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
