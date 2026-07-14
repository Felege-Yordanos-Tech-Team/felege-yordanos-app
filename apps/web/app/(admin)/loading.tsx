import { Skeleton } from '@/components/ui/skeleton';

/**
 * Group-level fallback for the (admin) route group. Mirrors the admin panel
 * index so any admin route without its own loading.tsx still shows a skeleton
 * that matches the shell (header + summary strip + link cards).
 */
export default function AdminGroupLoading() {
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
          <Skeleton key={i} className="h-[108px] w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
