import { Skeleton } from '@/components/ui/skeleton';

export default function DonateLoading() {
  return (
    <>
      {/* ─── MOBILE (< md) — single-column form ─── */}
      <div className="mx-auto max-w-md px-[22px] pb-6 pt-4 md:hidden">
        <Skeleton className="mb-1 h-3 w-12" />
        <Skeleton className="mb-1.5 h-7 w-48" />
        <Skeleton className="h-4 w-64" />

        <div className="mt-6 space-y-3.5">
          {/* Featured amount card */}
          <Skeleton className="h-28 w-full rounded-2xl" />
          {/* Payment method grid */}
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-[74px] rounded-xl" />
            <Skeleton className="h-[74px] rounded-xl" />
            <Skeleton className="h-[74px] rounded-xl" />
            <Skeleton className="h-[74px] rounded-xl" />
          </div>
          {/* Notes + receipt + submit */}
          <Skeleton className="h-16 w-full rounded-[10px]" />
          <Skeleton className="h-[70px] w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>

        {/* Past donations */}
        <Skeleton className="mt-[26px] h-6 w-40" />
        <div className="mt-2.5 space-y-2">
          <Skeleton className="h-[72px] rounded-xl" />
          <Skeleton className="h-[72px] rounded-xl" />
        </div>
      </div>

      {/* ─── DESKTOP (md+) — two-column: form + giving history ─── */}
      <div className="hidden md:block">
        <div className="px-7 py-7">
          {/* Page header */}
          <div className="mb-6">
            <Skeleton className="mb-1 h-3 w-12" />
            <Skeleton className="mb-1.5 h-9 w-72" />
            <Skeleton className="h-4 w-96" />
          </div>

          <div className="grid grid-cols-[minmax(0,420px)_minmax(0,1fr)] items-start gap-4">
            {/* LEFT — donation form card */}
            <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
              {/* Amount */}
              <div>
                <Skeleton className="mb-2 h-3 w-24" />
                <Skeleton className="h-[68px] w-full rounded-xl" />
                <div className="mt-2.5 flex gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 flex-1 rounded-lg" />
                  ))}
                </div>
              </div>
              {/* Method */}
              <div>
                <Skeleton className="mb-2 h-3 w-16" />
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-[50px] w-full rounded-xl" />
                  ))}
                </div>
              </div>
              {/* Receipt */}
              <div>
                <Skeleton className="mb-2 h-3 w-20" />
                <Skeleton className="h-[104px] w-full rounded-xl" />
              </div>
              {/* Submit */}
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>

            {/* RIGHT — giving history */}
            <div className="rounded-2xl border border-border bg-card p-6">
              {/* History header */}
              <div className="flex items-start justify-between">
                <div>
                  <Skeleton className="mb-1 h-3 w-20" />
                  <Skeleton className="h-7 w-44" />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>

              {/* History table */}
              <div className="mt-5">
                {/* Column headers */}
                <div className="flex items-center gap-4 border-b border-border pb-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="ml-auto h-3 w-16" />
                </div>
                {/* Rows */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 border-b border-border/60 py-3.5"
                  >
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="ml-auto h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>

              {/* Footer note */}
              <Skeleton className="mt-5 h-4 w-80" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
