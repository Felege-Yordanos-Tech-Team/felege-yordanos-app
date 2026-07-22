import { Skeleton } from '@/components/ui/skeleton';

export default function SongsAdminLoading() {
  return (
    <div className="mx-auto max-w-4xl px-[22px] pb-6 pt-4">
      {/* Back link */}
      <Skeleton className="mb-2.5 h-3 w-24" />

      {/* Header (eyebrow + title, no subtitle) */}
      <Skeleton className="mb-1 h-3 w-28" />
      <Skeleton className="h-8 w-56" />

      <div className="mt-4 flex flex-col gap-4">
        {/* Add song button */}
        <div className="flex justify-end">
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>

        {/* Categories card */}
        <div className="rounded-2xl border border-border bg-card px-4 py-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-24 rounded-full" />
            ))}
          </div>
        </div>

        {/* Toolbar: search + category select */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton className="h-10 flex-1 rounded-[10px]" />
          <Skeleton className="h-10 w-full rounded-[10px] sm:w-[180px]" />
        </div>

        {/* Songs table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {/* Header */}
          <div
            className="grid items-center gap-2 border-b border-border bg-gold/[0.10] px-3.5 py-2.5 dark:bg-gold/[0.04]"
            style={{ gridTemplateColumns: '40px 1fr 80px 72px' }}
          >
            <Skeleton className="h-3 w-4" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-14" />
            <span />
          </div>
          {/* Rows */}
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="grid items-center gap-2 border-b border-border px-3.5 py-2.5 last:border-0"
              style={{ gridTemplateColumns: '40px 1fr 80px 72px' }}
            >
              <Skeleton className="h-4 w-6" />
              <div className="min-w-0 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-3 w-12" />
              <div className="flex justify-end gap-1">
                <Skeleton className="h-[26px] w-[26px] rounded-md" />
                <Skeleton className="h-[26px] w-[26px] rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
