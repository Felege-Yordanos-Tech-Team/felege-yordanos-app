import { Skeleton } from '@/components/ui/skeleton';

const bone = 'bg-parchment-deep';

export default function AttendanceAdminLoading() {
  return (
    <>
      {/* Phone */}
      <div className="px-[18px] pb-6 pt-3.5 md:hidden">
        <Skeleton className={`mb-2.5 h-3 w-24 ${bone}`} />
        <div className="flex items-end justify-between gap-3">
          <div>
            <Skeleton className={`mb-1.5 h-3 w-24 ${bone}`} />
            <Skeleton className={`h-7 w-48 ${bone}`} />
          </div>
          <Skeleton className={`h-9 w-24 shrink-0 ${bone}`} />
        </div>
        <Skeleton className={`my-3.5 h-9 w-full rounded-[10px] ${bone}`} />
        <Skeleton className={`mb-2 h-3 w-20 ${bone}`} />
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className={`h-[62px] w-full ${bone}`} />
          ))}
        </div>
        <Skeleton className={`mb-2 mt-5 h-3 w-14 ${bone}`} />
        <Skeleton className={`h-40 w-full ${bone}`} />
      </div>

      {/* Desktop */}
      <div className="hidden px-7 py-7 md:block">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <Skeleton className={`mb-1.5 h-3 w-28 ${bone}`} />
            <Skeleton className={`mb-1.5 h-8 w-64 ${bone}`} />
            <Skeleton className={`h-3 w-80 ${bone}`} />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className={`h-9 w-48 rounded-[10px] ${bone}`} />
            <Skeleton className={`h-10 w-36 ${bone}`} />
          </div>
        </div>
        <div className="rounded-2xl border border-parchment-edge bg-parchment-soft p-5">
          <Skeleton className={`mb-3 h-3 w-full ${bone}`} />
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-parchment-edge py-3.5"
            >
              <Skeleton className={`h-5 flex-1 ${bone}`} />
              <Skeleton className={`h-4 w-24 ${bone}`} />
              <Skeleton className={`h-4 w-16 ${bone}`} />
              <Skeleton className={`h-4 w-12 ${bone}`} />
              <Skeleton className={`h-5 w-24 rounded-full ${bone}`} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
