import { requireUser } from '@/lib/session';
import { ClaimForm } from './claim-form';

export default async function ClaimPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-md px-6 py-6">
      <ClaimForm />
    </div>
  );
}
