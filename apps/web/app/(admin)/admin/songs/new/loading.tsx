import { Skeleton } from '@/components/ui/skeleton';

export default function NewSongLoading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <Skeleton className="mb-6 h-8 w-32" />
      <div className="rounded-xl bg-card p-6 space-y-4">
        <Skeleton className="h-3 w-16" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
