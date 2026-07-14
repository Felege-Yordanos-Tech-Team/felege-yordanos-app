import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-md px-[22px] pb-6 pt-4">
      {/* Header */}
      <Skeleton className="mb-1 h-3 w-16" />
      <Skeleton className="h-7 w-40" />

      <div className="mt-3.5 space-y-4">
        {/* Avatar + name */}
        <div className="flex items-center gap-3.5">
          <Skeleton className="h-[60px] w-[60px] shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
        </div>

        {/* QR / check-in card */}
        <Skeleton className="h-44 w-full rounded-2xl" />

        {/* Account section */}
        <div>
          <Skeleton className="mb-2 h-3 w-16" />
          <div className="rounded-2xl border border-border bg-card px-4 py-3.5">
            <Skeleton className="mb-1.5 h-3 w-24" />
            <Skeleton className="h-10 w-full rounded-[10px]" />
            <Skeleton className="mt-3.5 h-11 w-full rounded-xl" />
          </div>
        </div>

        {/* Sign out */}
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}
