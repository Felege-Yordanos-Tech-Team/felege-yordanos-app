import { Skeleton } from '@/components/ui/skeleton';

export default function DonationsAdminLoading() {
  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4">
      {/* Back link */}
      <Skeleton className="mb-2.5 h-3 w-24" />

      {/* Header */}
      <Skeleton className="mb-1 h-3 w-16" />
      <Skeleton className="mb-1 h-8 w-48" />
      <Skeleton className="h-3 w-72" />

      {/* Totals strip */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Skeleton className="h-[86px] rounded-xl" />
        <Skeleton className="h-[86px] rounded-xl" />
      </div>

      {/* Filter pills */}
      <div className="mb-3 mt-4 flex gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-full" />
        ))}
      </div>

      {/* Donation cards */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-[116px] rounded-xl" />
        <Skeleton className="h-[116px] rounded-xl" />
        <Skeleton className="h-[68px] rounded-xl" />
        <Skeleton className="h-[68px] rounded-xl" />
      </div>
    </div>
  );
}
