import { Skeleton } from '@/components/ui/skeleton';

/**
 * Group-level fallback for the (member) route group — a neutral skeleton for
 * any member route that lacks its own loading.tsx. Stays centered and narrow on
 * mobile, widening on desktop so it doesn't read as a narrow column on wide
 * screens (each tab supplies its own layout-accurate skeleton).
 */
export default function MemberLoading() {
  return (
    <div className="mx-auto max-w-2xl px-[22px] py-6 md:max-w-[1180px] md:px-8 md:py-7">
      {/* Header */}
      <Skeleton className="mb-1 h-3 w-24" />
      <Skeleton className="mb-6 h-8 w-56" />

      {/* Content blocks */}
      <div className="space-y-3 md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
        <Skeleton className="h-40 rounded-2xl md:col-span-2" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
      <div className="mt-3 space-y-2 md:mt-6">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  );
}
