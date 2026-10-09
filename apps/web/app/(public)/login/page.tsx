import { redirect } from 'next/navigation';
import { googleEnabled } from '@/lib/auth';
import { getSession } from '@/lib/session';
import { LoginForm } from './login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getSession()) redirect('/dashboard');
  // A failed or cancelled Google sign-in comes back as ?error=<code>.
  const { error } = await searchParams;
  return <LoginForm googleEnabled={googleEnabled} oauthError={error ?? null} />;
}
