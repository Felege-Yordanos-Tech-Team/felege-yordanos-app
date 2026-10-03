import { Card } from '@/components/ds';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClaimLoading() {
  return (
    <div className="mx-auto max-w-md px-[22px] pb-6 pt-4 md:max-w-lg md:px-7 md:py-10">
      <Skeleton className="mb-1.5 h-3 w-32 bg-parchment-deep" />
      <Skeleton className="mb-4 h-8 w-64 bg-parchment-deep" />
      <Card className="space-y-4 p-[22px] md:p-[26px]">
        <Skeleton className="h-10 w-full bg-parchment-deep" />
        <Skeleton className="h-[42px] w-full rounded-[10px] bg-parchment-deep" />
        <Skeleton className="h-11 w-full rounded-xl bg-parchment-deep" />
      </Card>
    </div>
  );
}
