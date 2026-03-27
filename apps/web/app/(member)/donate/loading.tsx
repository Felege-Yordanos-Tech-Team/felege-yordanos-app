import { Skeleton } from '@/components/ui/skeleton';

export default function DonateLoading() {
  return (
    <div className="mx-auto max-w-md px-6 py-6">
      <Skeleton className="mb-1 h-3 w-12" />
      <Skeleton className="mb-1 h-8 w-48" />
      <Skeleton className="h-4 w-64" />

      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      <Skeleton className="mt-8 h-6 w-36" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    </div>
  );
}
