import { Skeleton } from '@/components/ui/skeleton';

export default function NewSongLoading() {
  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4">
      {/* Back link */}
      <Skeleton className="mb-2.5 h-3 w-16" />

      {/* Header */}
      <Skeleton className="mb-1 h-3 w-24" />
      <Skeleton className="h-8 w-40" />

      {/* Ornament rule */}
      <div className="my-4 h-px w-full bg-border" />

      {/* Form */}
      <div className="space-y-3.5">
        {/* Number + Category */}
        <div className="grid gap-2.5" style={{ gridTemplateColumns: '100px 1fr' }}>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-10 w-full rounded-[10px]" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10 w-full rounded-[10px]" />
          </div>
        </div>
        {/* Amharic title */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-10 w-full rounded-[10px]" />
        </div>
        {/* English title */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-10 w-full rounded-[10px]" />
        </div>
        {/* Lyrics */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-[180px] w-full rounded-xl" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        {/* Audio URL */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-full rounded-[10px]" />
        </div>
        {/* Actions */}
        <div className="flex gap-2.5 pt-2">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
