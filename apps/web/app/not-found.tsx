import { HomeLink, StatusPage } from '@/components/status-page';
import { getT } from '@/lib/i18n/server';

export default async function NotFound() {
  const t = await getT();
  return (
    <StatusPage
      title={t('Page not found')}
      subtitle={t('This page does not exist or was moved.')}
    >
      <HomeLink label={t('Go home')} />
    </StatusPage>
  );
}
