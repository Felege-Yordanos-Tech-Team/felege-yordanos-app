import { Card } from '@/components/ds';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function Bone({ className }: { className?: string }) {
  return <Skeleton className={cn('bg-parchment-deep', className)} />;
}

export default function DonateLoading() {
  return (
    <>
      {/* ─── PHONE (< md) ─── */}
      <div className="mx-auto max-w-md px-[22px] pb-6 pt-4 md:hidden">
        <Bone className="mb-1.5 h-3 w-24 rounded-md" />
        <Bone className="mb-2 h-7 w-48 rounded-md" />
        <Bone className="h-4 w-64 rounded-md" />

        <div className="mt-6 space-y-3.5">
          <Bone className="h-28 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Bone key={i} className="h-[74px]" />
            ))}
          </div>
          <Bone className="h-16 w-full rounded-[10px]" />
          <Bone className="h-[70px] w-full" />
          <Bone className="h-12 w-full" />
        </div>

        <Bone className="mt-[26px] h-6 w-40 rounded-md" />
        <div className="mt-2.5 space-y-2">
          <Bone className="h-[72px]" />
          <Bone className="h-[72px]" />
        </div>
      </div>

      {/* ─── DESKTOP (md+) ─── */}
      <div className="hidden px-7 py-7 md:block">
        <div className="mb-4">
          <Bone className="mb-1.5 h-3 w-24 rounded-md" />
          <Bone className="mb-2 h-8 w-64 rounded-md" />
          <Bone className="h-3 w-80 rounded-md" />
        </div>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
          <Card className="space-y-4 p-6">
            <Bone className="h-3 w-24 rounded-md" />
            <Bone className="h-[54px] w-full" />
            <div className="flex gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Bone key={i} className="h-7 flex-1 rounded-full" />
              ))}
            </div>
            <Bone className="h-3 w-16 rounded-md" />
            <div className="space-y-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Bone key={i} className="h-10 w-full rounded-[10px]" />
              ))}
            </div>
            <Bone className="h-12 w-full rounded-[10px]" />
            <Bone className="h-[92px] w-full" />
            <Bone className="h-11 w-full" />
          </Card>

          <Card className="p-6">
            <div className="mb-3.5 flex items-center justify-between">
              <div>
                <Bone className="mb-1.5 h-3 w-20 rounded-md" />
                <Bone className="h-6 w-40 rounded-md" />
              </div>
              <Bone className="h-4 w-32 rounded-md" />
            </div>
            <div className="border-b border-parchment-edge-strong pb-[9px]">
              <Bone className="h-3 w-full rounded-md" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-parchment-edge py-3"
              >
                <Bone className="h-4 w-16 rounded-md" />
                <Bone className="h-4 w-24 rounded-md" />
                <Bone className="h-4 w-24 rounded-md" />
                <Bone className="ml-auto h-5 w-16 rounded-full" />
              </div>
            ))}
            <Bone className="mt-3.5 h-3 w-80 rounded-md" />
          </Card>
        </div>
      </div>
    </>
  );
}
