import { Skeleton } from '@/components/ui/skeleton';

export default function SongbookLoading() {
  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-[18px]">
      {/* Header: stacked title (left) + count (right) */}
      <div className="flex items-end justify-between">
        <div>
          <Skeleton className="mb-1 h-3 w-20" />
          <Skeleton className="mb-1 h-12 w-32" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-2.5 w-10" />
        </div>
      </div>

      {/* Ornament rule */}
      <div className="my-[18px] h-px w-full bg-border" />

      <div className="space-y-3.5">
        {/* Search */}
        <Skeleton className="h-[42px] w-full rounded-xl" />

        {/* Category pills */}
        <div className="flex gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 shrink-0 rounded-full" />
          ))}
        </div>

        {/* Song list */}
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 pl-4"
            >
              <Skeleton className="h-10 w-10 shrink-0 rounded-[10px]" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton className="h-3 w-12 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
