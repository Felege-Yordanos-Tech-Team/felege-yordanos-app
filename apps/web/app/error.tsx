'use client';

import { useEffect } from 'react';
import {
  HomeLink,
  StatusPage,
  secondaryButton,
} from '@/components/status-page';
import { useT } from '@/lib/i18n/client';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      title={t('Something went wrong')}
      subtitle={t('An unexpected error occurred. Please try again.')}
    >
      <button type="button" onClick={reset} className={secondaryButton}>
        {t('Try again')}
      </button>
      <HomeLink label={t('Go home')} />
    </StatusPage>
  );
}
