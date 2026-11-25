'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Re-renders the page from the server every `ms` while `active`. */
export function AutoRefresh({ active, ms = 3000 }: { active: boolean; ms?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => router.refresh(), ms);
    return () => clearInterval(id);
  }, [active, ms, router]);
  return null;
}
