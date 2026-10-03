import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-[18px]">
      {/* Header */}
      <Skeleton className="mb-1 h-3 w-28" />
      <Skeleton className="h-9 w-44" />
      <Skeleton className="mb-[22px] mt-3.5 h-0.5 w-12" />

      {/* Today summary strip */}
      <Skeleton className="mb-[22px] h-[86px] w-full rounded-2xl" />

      {/* Link cards */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-parchment-edge bg-parchment-soft px-[18px] py-[18px] pl-[22px]"
          >
            <div className="flex items-start gap-3.5">
              <Skeleton className="h-[42px] w-[42px] shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="mt-1 h-3 w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
