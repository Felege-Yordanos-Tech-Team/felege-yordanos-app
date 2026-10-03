import { Skeleton } from '@/components/ui/skeleton';

const Bone = ({ className }: { className: string }) => (
  <Skeleton className={`bg-parchment-deep ${className}`} />
);

/** Loading state for the new / edit song form (matches SongForm's layout). */
export function SongFormSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4 md:mx-0 md:max-w-[760px] md:px-7 md:py-7">
      <Bone className="mb-2.5 h-3 w-16" />
      <Bone className="mb-1 h-3 w-24" />
      <Bone className="h-8 w-44" />

      <div className="my-4 h-px w-full bg-parchment-edge" />

      <div className="space-y-3.5 md:rounded-2xl md:border md:border-parchment-edge md:bg-parchment-soft md:p-7">
        <div className="grid grid-cols-[100px_1fr] gap-2.5">
          <div className="space-y-1.5">
            <Bone className="h-2.5 w-14" />
            <Bone className="h-[42px] w-full rounded-[10px]" />
          </div>
          <div className="space-y-1.5">
            <Bone className="h-2.5 w-16" />
            <Bone className="h-[42px] w-full rounded-[10px]" />
          </div>
        </div>
        {['w-32', 'w-44'].map((w) => (
          <div key={w} className="space-y-1.5">
            <Bone className={`h-2.5 ${w}`} />
            <Bone className="h-[42px] w-full rounded-[10px]" />
          </div>
        ))}
        <div className="space-y-1.5">
          <Bone className="h-2.5 w-16" />
          <Bone className="h-[180px] w-full rounded-xl" />
          <div className="flex justify-between">
            <Bone className="h-2.5 w-44" />
            <Bone className="h-2.5 w-16" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Bone className="h-2.5 w-28" />
          <Bone className="h-[42px] w-full rounded-[10px]" />
        </div>
        <div className="flex gap-2.5 pt-2">
          <Bone className="h-11 flex-1 rounded-xl" />
          <Bone className="h-11 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
