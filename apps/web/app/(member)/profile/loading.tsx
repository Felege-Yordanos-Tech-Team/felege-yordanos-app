import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-md px-6 py-6">
      <Skeleton className="mb-1 h-3 w-16" />
      <Skeleton className="mb-1 h-8 w-28" />
      <Skeleton className="h-4 w-48" />

      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      <div className="mt-8 rounded-xl bg-card p-4 space-y-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
