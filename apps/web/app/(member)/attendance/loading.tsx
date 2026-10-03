import { Skeleton } from '@/components/ui/skeleton';

const bone = 'bg-parchment-deep';

export default function AttendanceLoading() {
  return (
    <>
      {/* Phone */}
      <div className="px-[18px] pb-6 pt-4 md:hidden">
        <div className="flex items-end justify-between">
          <div>
            <Skeleton className={`mb-1.5 h-3 w-20 ${bone}`} />
            <Skeleton className={`h-7 w-40 ${bone}`} />
          </div>
          <Skeleton className={`h-8 w-12 ${bone}`} />
        </div>
        <Skeleton className={`mt-3.5 h-[62px] w-full rounded-[14px] ${bone}`} />
        <Skeleton className={`my-3.5 h-9 w-full rounded-[10px] ${bone}`} />
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className={`h-[62px] w-full ${bone}`} />
          ))}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden px-7 py-7 md:block">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <Skeleton className={`mb-1.5 h-3 w-24 ${bone}`} />
            <Skeleton className={`mb-1.5 h-8 w-56 ${bone}`} />
            <Skeleton className={`h-3 w-72 ${bone}`} />
          </div>
          <Skeleton className={`h-9 w-48 rounded-[10px] ${bone}`} />
        </div>
        <Skeleton className={`mb-4 h-[52px] w-full rounded-[14px] ${bone}`} />
        <div className="rounded-2xl border border-parchment-edge bg-parchment-soft p-[22px]">
          <Skeleton className={`mb-1.5 h-3 w-20 ${bone}`} />
          <Skeleton className={`mb-5 h-6 w-36 ${bone}`} />
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-parchment-edge py-3.5"
            >
              <Skeleton className={`h-5 flex-1 ${bone}`} />
              <Skeleton className={`h-4 w-20 ${bone}`} />
              <Skeleton className={`h-4 w-14 ${bone}`} />
              <Skeleton className={`h-4 w-12 ${bone}`} />
              <Skeleton className={`h-5 w-20 rounded-full ${bone}`} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
