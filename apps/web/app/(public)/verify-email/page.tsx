import { redirect } from 'next/navigation';
import { codeState } from '@/lib/email-verification';
import { getCurrentUser } from '@/lib/session';
import { VerifyEmailForm } from './verify-form';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ required?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.emailVerified) redirect('/dashboard');

  const [{ required }, state] = await Promise.all([
    searchParams,
    codeState(user.email),
  ]);

  return (
    <VerifyEmailForm
      email={user.email}
      hasCode={state.hasValidCode}
      resendIn={state.resendIn}
      required={required === '1'}
      staff={user.assignedRole !== 'member'}
    />
  );
}
