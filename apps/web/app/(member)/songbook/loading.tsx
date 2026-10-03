import { Card } from '@/components/ds';
import { Skeleton } from '@/components/ui/skeleton';

const Bone = ({ className }: { className: string }) => (
  <Skeleton className={`bg-parchment-deep ${className}`} />
);

export default function SongbookLoading() {
  return (
    <>
      {/* Phone */}
      <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-[18px] md:hidden">
        <div className="flex items-end justify-between">
          <div>
            <Bone className="mb-1.5 h-3 w-20" />
            <Bone className="mb-1 h-12 w-36" />
            <Bone className="h-4 w-20" />
          </div>
          <div className="flex flex-col items-end gap-1">
            <Bone className="h-3 w-6" />
            <Bone className="h-2.5 w-12" />
          </div>
        </div>
        <div className="mb-[18px] mt-3.5 h-px w-full bg-parchment-edge" />
        <Bone className="mb-3.5 h-[42px] w-full rounded-xl" />
        <div className="mb-4 flex gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-7 w-16 shrink-0 rounded-full" />
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-parchment-edge bg-parchment-soft py-[11px] pl-3 pr-3.5"
            >
              <Bone className="h-10 w-10 shrink-0 rounded-[10px]" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Bone className="h-4 w-3/5" />
                <Bone className="h-3 w-2/5" />
              </div>
              <Bone className="h-2.5 w-10 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden px-7 py-7 md:block">
        <div className="grid h-[calc(100vh-110px)] min-h-[560px] grid-cols-[350px_1fr] gap-4">
          <Card className="flex flex-col overflow-hidden p-5">
            <div className="flex items-end justify-between">
              <div>
                <Bone className="mb-1.5 h-6 w-24" />
                <Bone className="h-3 w-16" />
              </div>
              <Bone className="h-5 w-10" />
            </div>
            <Bone className="mb-2.5 mt-3 h-[34px] w-full rounded-[10px]" />
            <div className="flex gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Bone key={i} className="h-6 w-14 rounded-full" />
              ))}
            </div>
            <div className="mt-4 space-y-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Bone className="h-8 w-8 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Bone className="h-3.5 w-3/5" />
                    <Bone className="h-2.5 w-2/5" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-[30px]">
            <div className="max-w-[640px]">
              <div className="flex items-start gap-4">
                <Bone className="h-[60px] w-[60px] shrink-0 rounded-[14px]" />
                <div className="flex-1 space-y-2 pt-1">
                  <Bone className="h-7 w-1/2" />
                  <Bone className="h-4 w-1/3" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Bone className="h-6 w-20 rounded-full" />
                <Bone className="h-6 w-28 rounded-full" />
              </div>
              <div className="mt-[22px] space-y-3 rounded-2xl border border-parchment-edge px-7 pb-7 pt-6">
                <Bone className="mb-4 h-2.5 w-12" />
                {['w-3/5', 'w-1/2', 'w-2/3', 'w-3/5', 'w-1/2', 'w-2/3'].map(
                  (w, i) => (
                    <Bone key={i} className={`h-4 ${w}`} />
                  ),
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
