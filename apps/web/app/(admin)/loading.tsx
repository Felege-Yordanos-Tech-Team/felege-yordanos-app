import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <Skeleton className="mb-1 h-3 w-24" />
      <Skeleton className="mb-2 h-10 w-40" />
      <Skeleton className="mb-8 h-[2px] w-12" />
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
