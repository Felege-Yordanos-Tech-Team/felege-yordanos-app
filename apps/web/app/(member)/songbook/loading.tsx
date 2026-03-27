import { Skeleton } from '@/components/ui/skeleton';

export default function SongbookLoading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <Skeleton className="mb-1 h-3 w-20" />
      <Skeleton className="mb-1 h-12 w-32" />
      <Skeleton className="mb-2 h-8 w-28" />
      <Skeleton className="h-4 w-64" />

      {/* Search */}
      <Skeleton className="mt-6 h-12 w-full rounded-xl" />

      {/* Category pills */}
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-20 shrink-0 rounded-full" />
        ))}
      </div>

      {/* Song list */}
      <div className="mt-6 space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl p-4">
            <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
