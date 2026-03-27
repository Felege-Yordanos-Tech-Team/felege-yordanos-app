import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <Skeleton className="mb-1 h-3 w-24" />
      <Skeleton className="mb-2 h-10 w-40" />
      <Skeleton className="mb-8 h-[2px] w-12" />

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-surface-container-low p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
