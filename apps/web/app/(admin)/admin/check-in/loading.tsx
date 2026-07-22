import { Skeleton } from '@/components/ui/skeleton';

export default function CheckInLoading() {
  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4 md:max-w-[1180px] md:px-8 md:pt-7">
      {/* Back link (mobile only) */}
      <Skeleton className="mb-2.5 h-3 w-24 md:hidden" />

      {/* Header: title left, event picker right */}
      <div className="md:flex md:items-end md:justify-between md:gap-6">
        <div>
          <Skeleton className="mb-1 h-3 w-16" />
          <Skeleton className="mb-1 h-8 w-40 md:h-9" />
          <Skeleton className="h-3 w-64 md:h-4" />
        </div>
        <div className="mt-4 w-full md:mt-0 md:w-[340px]">
          <Skeleton className="h-[42px] w-full rounded-lg" />
        </div>
      </div>

      {/* Ornament rule (mobile) */}
      <div className="my-4 h-px w-full bg-border md:hidden" />

      {/* Selected event title */}
      <div className="mt-5 md:mt-6">
        <Skeleton className="h-7 w-52" />
        <div className="mt-1.5 flex gap-1.5">
          <Skeleton className="h-5 w-24 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
      </div>

      {/* ─── MOBILE (< md) — tabbed check-in ─── */}
      <div className="mt-4 md:hidden">
        <Skeleton className="mb-3.5 h-11 w-full rounded-xl" />
        <Skeleton className="mb-3.5 h-32 w-full rounded-2xl" />
        <Skeleton className="mb-3.5 h-14 w-full rounded-2xl" />
        <Skeleton className="mb-2 h-3 w-16" />
        <div className="space-y-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-[10px]" />
          ))}
        </div>
      </div>

      {/* ─── DESKTOP (md+) — rail + member table ─── */}
      <div className="mt-6 hidden md:grid md:grid-cols-[minmax(0,360px)_minmax(0,1fr)] md:items-start md:gap-6">
        {/* Left rail */}
        <div className="space-y-4">
          {/* Counter card */}
          <Skeleton className="h-[108px] w-full rounded-2xl" />
          {/* Entry card */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <Skeleton className="mb-3 h-9 w-full rounded-lg" />
            <Skeleton className="mb-2.5 h-[46px] w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          {/* Recent card */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <Skeleton className="mb-2 h-3 w-16" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-[10px]" />
              ))}
            </div>
          </div>
        </div>

        {/* Right: member table card */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {/* Header: title + search */}
          <div className="flex items-center justify-between gap-3 border-b border-border p-4">
            <div>
              <Skeleton className="mb-1 h-3 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-9 w-60 rounded-lg" />
          </div>
          {/* Table header */}
          <div className="flex items-center gap-4 border-b border-border px-4 py-2.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="ml-auto h-3 w-16" />
          </div>
          {/* Rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-border/50 px-4 py-2.5 last:border-0"
            >
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-40" />
              <div className="ml-auto flex gap-1">
                <Skeleton className="h-8 w-8 rounded-[9px]" />
                <Skeleton className="h-8 w-8 rounded-[9px]" />
                <Skeleton className="h-8 w-8 rounded-[9px]" />
              </div>
            </div>
          ))}
          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
