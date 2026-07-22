import { Skeleton } from '@/components/ui/skeleton';

export default function AttendanceAdminLoading() {
  return (
    <>
      {/* ─── MOBILE (< md) — stacked list ─── */}
      <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4 md:hidden">
        <Skeleton className="mb-2.5 h-3 w-24" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <Skeleton className="mb-1 h-3 w-20" />
            <Skeleton className="mb-1 h-8 w-56" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-9 w-20 shrink-0 rounded-xl" />
        </div>

        {/* View toggle (full-width) */}
        <Skeleton className="mt-3 h-9 w-full rounded-lg" />

        {/* Ornament rule */}
        <div className="my-4 h-px w-full bg-border" />

        {/* Upcoming */}
        <Skeleton className="mb-2 h-3 w-20" />
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[68px] w-full rounded-xl" />
          ))}
        </div>

        {/* Past */}
        <Skeleton className="mb-2 mt-5 h-3 w-14" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>

      {/* ─── DESKTOP (md+) — header row + table ─── */}
      <div className="hidden md:block">
        <div className="mx-auto max-w-[1180px] px-8 py-7">
          {/* Header row: title left, controls right */}
          <div className="flex items-end justify-between">
            <div>
              <Skeleton className="mb-1 h-3 w-24" />
              <Skeleton className="mb-1 h-9 w-72" />
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-40 rounded-lg" />
              <Skeleton className="h-9 w-32 rounded-xl" />
            </div>
          </div>

          {/* Table card */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
            {/* Header row */}
            <div className="flex items-center gap-4 border-b border-border px-5 py-3">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="ml-auto h-3 w-20" />
            </div>
            {/* Rows */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b border-border/60 px-5 py-3.5 last:border-0"
              >
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="ml-auto h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
