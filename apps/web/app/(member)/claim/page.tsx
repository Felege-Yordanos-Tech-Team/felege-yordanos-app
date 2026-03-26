import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import { ClaimForm } from './claim-form';

export default async function ClaimPage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <ClaimForm authUserId={user?.id ?? ''} />
    </div>
  );
}
