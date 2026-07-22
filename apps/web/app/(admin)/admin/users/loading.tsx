import { Skeleton } from '@/components/ui/skeleton';

export default function UsersAdminLoading() {
  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4">
      {/* Back link */}
      <Skeleton className="mb-2.5 h-3 w-24" />

      {/* Header */}
      <Skeleton className="mb-1 h-3 w-28" />
      <Skeleton className="mb-1 h-8 w-44" />
      <Skeleton className="h-3 w-72" />

      {/* Search */}
      <Skeleton className="mt-4 h-10 w-full rounded-[10px]" />

      {/* Role legend */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-20 rounded-full" />
        ))}
      </div>

      {/* User list */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-border px-3.5 py-2.5 last:border-0"
          >
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
            <Skeleton className="h-3.5 w-3.5 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
