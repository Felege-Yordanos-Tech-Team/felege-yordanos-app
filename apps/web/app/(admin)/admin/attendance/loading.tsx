import { Skeleton } from '@/components/ui/skeleton';

export default function AttendanceAdminLoading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <Skeleton className="mb-1 h-3 w-24" />
      <Skeleton className="mb-1 h-8 w-56" />
      <Skeleton className="h-4 w-72" />

      {/* Toolbar */}
      <div className="mt-6 flex items-center gap-3">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="ml-auto h-10 w-32 rounded-xl" />
      </div>

      {/* Table */}
      <div className="mt-4 rounded-xl overflow-hidden">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="mt-px h-14 w-full rounded-none" />
        ))}
      </div>
    </div>
  );
}
