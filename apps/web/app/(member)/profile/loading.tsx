import { Card } from '@/components/ds';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-md px-[22px] pb-6 pt-4 md:mx-0 md:max-w-none md:px-7 md:py-7">
      {/* Page head */}
      <Skeleton className="mb-1.5 h-3 w-20 bg-parchment-deep" />
      <Skeleton className="mb-4 h-8 w-44 bg-parchment-deep" />

      {/* Phone */}
      <div className="space-y-[18px] md:hidden">
        <div className="flex items-center gap-3.5">
          <Skeleton className="h-[60px] w-[60px] shrink-0 rounded-full bg-parchment-deep" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-5 w-40 bg-parchment-deep" />
            <Skeleton className="h-3 w-48 bg-parchment-deep" />
            <Skeleton className="h-4 w-16 rounded-full bg-parchment-deep" />
          </div>
        </div>
        <Skeleton className="h-[360px] w-full rounded-[18px] bg-parchment-deep" />
        <Card className="rounded-xl px-4 py-3.5">
          <Skeleton className="mb-1.5 h-3 w-24 bg-parchment-deep" />
          <Skeleton className="h-10 w-full rounded-[10px] bg-parchment-deep" />
          <Skeleton className="mt-3.5 h-11 w-full rounded-xl bg-parchment-deep" />
        </Card>
        <Skeleton className="h-11 w-full rounded-[10px] bg-parchment-deep" />
      </div>

      {/* Desktop */}
      <div className="hidden grid-cols-[1fr_380px] items-start gap-4 md:grid">
        <Card className="p-[26px]">
          <div className="mb-5 flex items-center gap-4">
            <Skeleton className="h-[58px] w-[58px] shrink-0 rounded-full bg-parchment-deep" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 bg-parchment-deep" />
              <Skeleton className="h-4 w-32 rounded-full bg-parchment-deep" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="mb-1.5 h-3 w-20 bg-parchment-deep" />
                <Skeleton className="h-[42px] w-full rounded-[10px] bg-parchment-deep" />
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <Skeleton className="h-9 w-32 rounded-[10px] bg-parchment-deep" />
            <Skeleton className="h-9 w-40 rounded-[10px] bg-parchment-deep" />
          </div>
        </Card>
        <Card className="flex flex-col items-center p-[26px]">
          <Skeleton className="h-3 w-20 bg-parchment-deep" />
          <Skeleton className="mt-2 h-6 w-36 bg-parchment-deep" />
          <Skeleton className="mt-4 h-[194px] w-[194px] rounded-[14px] bg-parchment-deep" />
          <Skeleton className="mt-3 h-4 w-24 bg-parchment-deep" />
        </Card>
      </div>
    </div>
  );
}
