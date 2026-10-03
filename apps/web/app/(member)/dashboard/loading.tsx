import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <>
      {/* ─── MOBILE (< md) — single-column stack ─── */}
      <div className="mx-auto max-w-2xl px-[18px] pb-6 pt-[14px] md:hidden">
        {/* Hero greeting card */}
        <Skeleton className="h-32 w-full rounded-[20px]" />

        {/* Quick actions */}
        <div className="mt-[22px]">
          <Skeleton className="mb-1 h-3 w-24" />
          <Skeleton className="mb-2.5 h-6 w-40" />
          <div className="grid grid-cols-2 gap-2.5">
            <Skeleton className="col-span-2 h-[76px] rounded-2xl" />
            <Skeleton className="aspect-square rounded-2xl" />
            <Skeleton className="aspect-square rounded-2xl" />
          </div>
        </div>

        {/* Events feed */}
        <div className="mt-[22px]">
          <Skeleton className="mb-1 h-3 w-28" />
          <Skeleton className="mb-3.5 h-6 w-44" />
          <div className="space-y-2">
            <Skeleton className="h-[86px] rounded-[14px]" />
            <Skeleton className="h-[86px] rounded-[14px]" />
            <Skeleton className="h-[86px] rounded-[14px]" />
          </div>
        </div>
      </div>

      {/* ─── DESKTOP (md+) — two-column dashboard ─── */}
      <div className="hidden md:block">
        <div className="px-7 py-7">
          {/* Hero band — full width */}
          <Skeleton className="h-[132px] w-full rounded-[20px]" />

          <div className="mt-4 grid grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] items-start gap-4">
            {/* Left: event feed card */}
            <div className="rounded-2xl border border-border bg-card p-5">
                <Skeleton className="mb-1 h-3 w-28" />
                <Skeleton className="mb-3.5 h-6 w-44" />
                {/* Filter pills */}
                <div className="mb-3.5 flex gap-1.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-7 w-16 shrink-0 rounded-full" />
                  ))}
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-[88px] rounded-[14px]" />
                  <Skeleton className="h-[88px] rounded-[14px]" />
                </div>
              </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Continue singing card */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex items-baseline justify-between">
                  <div>
                    <Skeleton className="mb-1 h-3 w-16" />
                    <Skeleton className="h-6 w-40" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="space-y-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-2 py-2">
                      <Skeleton className="h-3 w-6 shrink-0" />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>

              {/* My giving card */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <Skeleton className="mb-1 h-3 w-12" />
                <Skeleton className="mb-3 h-6 w-32" />
                <Skeleton className="h-8 w-48" />
                <div className="mt-4 border-t border-border pt-3">
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>

              {/* Check-in card */}
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
                <Skeleton className="h-[120px] w-[120px] shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
