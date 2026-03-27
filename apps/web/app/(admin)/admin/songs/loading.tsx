import { Skeleton } from '@/components/ui/skeleton';

export default function SongsAdminLoading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <Skeleton className="mb-1 h-3 w-24" />
      <Skeleton className="mb-1 h-8 w-44" />
      <Skeleton className="h-4 w-64" />

      {/* Categories card */}
      <div className="mt-6 rounded-xl bg-card p-6">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex items-center gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-[180px] rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      {/* Table */}
      <div className="mt-6 rounded-xl overflow-hidden">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="mt-px h-14 w-full rounded-none" />
        ))}
      </div>
    </div>
  );
}
