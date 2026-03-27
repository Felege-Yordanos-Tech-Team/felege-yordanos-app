import { Skeleton } from '@/components/ui/skeleton';

export default function UsersAdminLoading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <Skeleton className="mb-1 h-3 w-24" />
      <Skeleton className="mb-1 h-8 w-44" />
      <Skeleton className="h-4 w-72" />

      {/* Search */}
      <Skeleton className="mt-6 h-10 w-64 rounded-xl" />

      {/* Table */}
      <div className="mt-4 rounded-xl overflow-hidden">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="mt-px h-14 w-full rounded-none" />
        ))}
      </div>
    </div>
  );
}
