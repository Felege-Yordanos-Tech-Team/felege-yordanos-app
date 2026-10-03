import { Card } from '@/components/ds';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function Bone({ className }: { className?: string }) {
  return <Skeleton className={cn('bg-parchment-deep', className)} />;
}

export default function DonationsAdminLoading() {
  return (
    <>
      {/* ─── PHONE (< md) ─── */}
      <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4 md:hidden">
        <Bone className="mb-2.5 h-3 w-24 rounded-md" />
        <Bone className="mb-1.5 h-3 w-20 rounded-md" />
        <Bone className="mb-1.5 h-8 w-48 rounded-md" />
        <Bone className="h-3 w-72 rounded-md" />

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Bone className="h-[86px]" />
          <Bone className="h-[86px]" />
        </div>

        <div className="mb-3 mt-[18px] flex gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-8 w-20 shrink-0 rounded-full" />
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Bone className="h-[116px]" />
          <Bone className="h-[116px]" />
          <Bone className="h-[68px]" />
          <Bone className="h-[68px]" />
        </div>
      </div>

      {/* ─── DESKTOP (md+) ─── */}
      <div className="hidden px-7 py-7 md:block">
        <div className="mb-4">
          <Bone className="mb-1.5 h-3 w-28 rounded-md" />
          <Bone className="mb-2 h-8 w-64 rounded-md" />
          <Bone className="h-3 w-72 rounded-md" />
        </div>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="p-[22px]">
            <div className="border-b border-parchment-edge-strong pb-[9px]">
              <Bone className="h-3 w-full rounded-md" />
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-parchment-edge py-3"
              >
                <Bone className="h-[26px] w-[26px] rounded-full" />
                <Bone className="h-4 w-32 rounded-md" />
                <Bone className="ml-auto h-4 w-20 rounded-md" />
                <Bone className="h-4 w-24 rounded-md" />
                <Bone className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </Card>

          <Card>
            <Bone className="mb-2.5 h-3 w-28 rounded-md" />
            <Bone className="h-[190px] w-full" />
            <Bone className="mt-3.5 h-4 w-full rounded-md" />
            <Bone className="mt-2 h-3 w-40 rounded-md" />
            <div className="mt-4 flex gap-2">
              <Bone className="h-10 flex-1 rounded-[10px]" />
              <Bone className="h-10 flex-1 rounded-[10px]" />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
