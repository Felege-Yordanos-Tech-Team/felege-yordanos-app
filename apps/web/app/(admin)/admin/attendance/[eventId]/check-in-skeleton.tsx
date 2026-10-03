import { Skeleton } from '@/components/ui/skeleton';

const bone = 'bg-parchment-deep';

/** Loading state for the check-in screens (event check-in and the Check-in hub). */
export function CheckInSkeleton() {
  return (
    <>
      {/* Phone */}
      <div className="px-[18px] pb-6 pt-3 md:hidden">
        <Skeleton className={`mb-2.5 h-3 w-16 ${bone}`} />
        <Skeleton className={`mb-1.5 h-3 w-20 ${bone}`} />
        <Skeleton className={`h-7 w-52 ${bone}`} />
        <div className="mb-3.5 mt-1.5 flex gap-1.5">
          <Skeleton className={`h-5 w-28 rounded-md ${bone}`} />
          <Skeleton className={`h-5 w-20 rounded-md ${bone}`} />
        </div>
        <Skeleton className={`mb-3.5 h-11 w-full ${bone}`} />
        <Skeleton className={`mb-3.5 h-32 w-full rounded-[18px] ${bone}`} />
        <Skeleton className={`mb-3.5 h-14 w-full rounded-[14px] ${bone}`} />
        <Skeleton className={`mb-2 h-3 w-16 ${bone}`} />
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className={`h-12 w-full rounded-[10px] ${bone}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden px-7 py-7 md:block">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <Skeleton className={`mb-1.5 h-3 w-40 ${bone}`} />
            <Skeleton className={`mb-1.5 h-8 w-40 ${bone}`} />
            <Skeleton className={`h-3 w-52 ${bone}`} />
          </div>
          <Skeleton className={`h-9 w-24 rounded-[10px] ${bone}`} />
        </div>
        <div className="grid grid-cols-[minmax(0,380px)_minmax(0,1fr)] items-start gap-4">
          <div className="flex flex-col gap-4">
            <Skeleton className={`h-[134px] w-full rounded-[18px] ${bone}`} />
            <div className="rounded-2xl border border-parchment-edge bg-parchment-soft p-5">
              <Skeleton
                className={`mb-3.5 h-9 w-full rounded-[10px] ${bone}`}
              />
              <Skeleton className={`mb-2.5 h-[52px] w-full ${bone}`} />
              <Skeleton className={`h-[46px] w-full ${bone}`} />
            </div>
            <div className="rounded-2xl border border-parchment-edge bg-parchment-soft p-5">
              <Skeleton className={`mb-3 h-3 w-16 ${bone}`} />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className={`mb-2 h-6 w-full ${bone}`} />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-parchment-edge bg-parchment-soft p-[22px]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <Skeleton className={`mb-1.5 h-3 w-20 ${bone}`} />
                <Skeleton className={`h-6 w-36 ${bone}`} />
              </div>
              <Skeleton className={`h-8 w-60 rounded-[10px] ${bone}`} />
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-parchment-edge py-3"
              >
                <Skeleton className={`h-3.5 w-16 ${bone}`} />
                <Skeleton className={`h-4 flex-1 ${bone}`} />
                <div className="flex gap-[5px]">
                  <Skeleton className={`h-7 w-7 rounded-lg ${bone}`} />
                  <Skeleton className={`h-7 w-7 rounded-lg ${bone}`} />
                  <Skeleton className={`h-7 w-7 rounded-lg ${bone}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
