import { Skeleton } from '@/components/ui/skeleton';

const Bone = ({ className }: { className: string }) => (
  <Skeleton className={`bg-parchment-deep ${className}`} />
);

export default function SongDetailLoading() {
  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-3.5 md:px-7 md:py-7">
      <Bone className="mb-3.5 h-4 w-36" />

      <div className="flex items-start gap-3.5">
        <Bone className="h-14 w-14 shrink-0 rounded-[14px]" />
        <div className="flex-1 space-y-2 pt-1">
          <Bone className="h-6 w-48" />
          <Bone className="h-4 w-32" />
        </div>
      </div>

      <div className="mt-3.5 flex gap-2">
        <Bone className="h-6 w-20 rounded-full" />
        <Bone className="h-6 w-28 rounded-full" />
      </div>

      <div className="mt-[18px] space-y-3 rounded-2xl border border-parchment-edge bg-parchment-soft px-[22px] pb-6 pt-5">
        <Bone className="mb-3.5 h-2.5 w-12" />
        {['w-3/5', 'w-1/2', 'w-2/3', 'w-3/5', 'w-1/2', 'w-2/3', 'w-3/5'].map(
          (w, i) => (
            <Bone key={i} className={`h-4 ${w}`} />
          ),
        )}
      </div>
    </div>
  );
}
