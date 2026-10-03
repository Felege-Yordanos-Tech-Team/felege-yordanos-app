import { Card } from '@/components/ds';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <>
      {/* ─── PHONE (< md) ─── */}
      <div className="mx-auto max-w-2xl px-[18px] pb-6 pt-[14px] md:hidden">
        <Skeleton className="h-32 w-full rounded-[20px]" />

        <div className="mt-[18px]">
          <Skeleton className="mb-1.5 h-3 w-24" />
          <Skeleton className="mb-2.5 h-6 w-40" />
          <div className="grid grid-cols-2 gap-2.5">
            <Skeleton className="col-span-2 h-[78px] rounded-2xl" />
            <Skeleton className="aspect-square rounded-2xl" />
            <Skeleton className="aspect-square rounded-2xl" />
          </div>
        </div>

        <div className="mt-[22px]">
          <Skeleton className="mb-1.5 h-3 w-28" />
          <Skeleton className="mb-3.5 h-6 w-44" />
          <div className="space-y-2">
            <Skeleton className="h-[86px] rounded-[14px]" />
            <Skeleton className="h-[86px] rounded-[14px]" />
            <Skeleton className="h-[86px] rounded-[14px]" />
          </div>
        </div>
      </div>

      {/* ─── DESKTOP (md+) ─── */}
      <div className="hidden p-7 md:block">
        <Skeleton className="h-[130px] w-full rounded-[20px]" />

        <div className="mt-4 grid grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] items-start gap-4">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <Skeleton className="mb-1.5 h-3 w-28" />
                <Skeleton className="h-6 w-44" />
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-16 rounded-full" />
                ))}
              </div>
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3.5 border-t border-parchment-edge py-3.5 pl-4 first:border-t-0"
              >
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-12" />
              </div>
            ))}
          </Card>

          <div className="flex flex-col gap-4">
            <Card>
              <Skeleton className="mb-1.5 h-3 w-24" />
              <Skeleton className="mb-3 h-6 w-40" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 py-2.5">
                  <Skeleton className="h-[30px] w-[30px] shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </Card>
            <Card>
              <Skeleton className="mb-1.5 h-3 w-16" />
              <Skeleton className="mb-3 h-6 w-32" />
              <Skeleton className="h-7 w-44" />
              <div className="mt-2.5 border-t border-parchment-edge pt-2.5">
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
