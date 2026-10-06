import { Card } from '@/components/ds';
import { Skeleton } from '@/components/ui/skeleton';

const BONE = 'bg-parchment-deep';

export default function UsersAdminLoading() {
  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4 md:mx-0 md:max-w-none md:px-7 md:py-7">
      {/* Page head */}
      <Skeleton className={`mb-2.5 h-3 w-24 md:hidden ${BONE}`} />
      <Skeleton className={`mb-1.5 h-3 w-28 ${BONE}`} />
      <Skeleton className={`mb-1.5 h-8 w-52 ${BONE}`} />
      <Skeleton className={`h-3 w-72 ${BONE}`} />

      {/* Phone */}
      <div className="md:hidden">
        <Skeleton className={`mt-4 h-10 w-full rounded-[10px] ${BONE}`} />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className={`h-5 w-20 rounded-full ${BONE}`} />
          ))}
        </div>
        <div className="mt-3.5 overflow-hidden rounded-xl border border-parchment-edge bg-parchment-soft">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-parchment-edge px-3.5 py-[11px] last:border-0"
            >
              <Skeleton className={`h-9 w-9 shrink-0 rounded-full ${BONE}`} />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className={`h-4 w-40 ${BONE}`} />
                <Skeleton className={`h-3 w-24 ${BONE}`} />
              </div>
              <Skeleton className={`h-5 w-16 shrink-0 rounded-full ${BONE}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop */}
      <div className="mt-4 hidden md:block">
        <div className="mb-4 flex items-center gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className={`h-[26px] w-24 rounded-full ${BONE}`}
            />
          ))}
          <Skeleton
            className={`ml-auto h-9 w-[260px] rounded-[10px] ${BONE}`}
          />
        </div>
        <Card className="p-[22px]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-parchment-edge px-1 py-3"
            >
              <Skeleton className={`h-7 w-7 shrink-0 rounded-full ${BONE}`} />
              <Skeleton className={`h-4 w-48 ${BONE}`} />
              <Skeleton className={`ml-auto h-5 w-20 rounded-full ${BONE}`} />
              <Skeleton className={`h-3 w-24 ${BONE}`} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
