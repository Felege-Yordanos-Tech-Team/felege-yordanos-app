import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      {/* Hero Banner */}
      <Skeleton className="mb-8 h-32 w-full rounded-xl" />

      {/* Bento Quick Actions */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        <Skeleton className="col-span-2 h-40 rounded-xl" />
        <Skeleton className="aspect-square rounded-xl" />
        <Skeleton className="aspect-square rounded-xl" />
      </div>

      {/* Events */}
      <Skeleton className="mb-2 h-4 w-24" />
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  );
}
