import { PageHead } from '@/components/ds';
import { requireUser } from '@/lib/session';
import { ClaimForm } from './claim-form';

export default async function ClaimPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-md px-[22px] pb-6 pt-4 md:max-w-lg md:px-7 md:py-10">
      <PageHead
        en="Link your member profile"
        am="የአባልነት መለያዎን ያገናኙ"
        className="mb-3.5 md:mb-4"
      />
      <ClaimForm />
    </div>
  );
}
