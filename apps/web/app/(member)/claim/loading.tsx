import { Skeleton } from '@/components/ui/skeleton';

export default function ClaimLoading() {
  return (
    <div className="mx-auto max-w-md px-6 py-6">
      <Skeleton className="mb-4 h-8 w-48" />
      <Skeleton className="h-4 w-64" />

      <div className="mt-6 space-y-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}
