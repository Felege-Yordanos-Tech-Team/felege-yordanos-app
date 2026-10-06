import { Card } from '@/components/ds';
import { Skeleton } from '@/components/ui/skeleton';

const Bone = ({ className }: { className: string }) => (
  <Skeleton className={`bg-parchment-deep ${className}`} />
);

export default function SongsAdminLoading() {
  return (
    <div className="mx-auto max-w-4xl px-[22px] pb-6 pt-4 md:mx-0 md:max-w-none md:px-7 md:py-7">
      {/* Header */}
      <Bone className="mb-2.5 h-3 w-24 md:hidden" />
      <div className="flex items-end justify-between gap-4 md:mb-4">
        <div>
          <Bone className="mb-1.5 h-3 w-28" />
          <Bone className="h-8 w-56" />
          <Bone className="mt-2 hidden h-3 w-40 md:block" />
        </div>
        <Bone className="h-[38px] w-24 rounded-xl md:w-32" />
      </div>

      {/* Phone */}
      <div className="mt-4 flex flex-col md:hidden">
        <div className="rounded-[14px] border border-parchment-edge bg-parchment-soft px-4 py-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <Bone className="h-2.5 w-20" />
            <Bone className="h-8 w-16 rounded-[10px]" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Bone key={i} className="h-7 w-24 rounded-full" />
            ))}
          </div>
        </div>
        <div className="mt-3.5 flex gap-1.5">
          <Bone className="h-[38px] flex-1 rounded-[10px]" />
          <Bone className="h-[38px] w-32 rounded-[10px]" />
        </div>
        <div className="mt-3.5 overflow-hidden rounded-xl border border-parchment-edge bg-parchment-soft">
          <div className="h-9 border-b border-parchment-edge bg-gold/10 dark:bg-gold/[0.04]" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[36px_1fr_56px_64px] items-center gap-2 border-b border-parchment-edge px-3.5 py-[11px] last:border-0"
            >
              <Bone className="h-3.5 w-5" />
              <div className="space-y-1.5">
                <Bone className="h-4 w-3/4" />
                <Bone className="h-3 w-1/2" />
              </div>
              <Bone className="h-2.5 w-10" />
              <div className="flex justify-end gap-1">
                <Bone className="h-[26px] w-[26px] rounded-[7px]" />
                <Bone className="h-[26px] w-[26px] rounded-[7px]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden grid-cols-[230px_1fr] items-start gap-4 md:grid">
        <Card className="space-y-2.5 p-3.5">
          <Bone className="mx-2 mb-3 mt-1 h-2.5 w-20" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="mx-2.5 h-4 w-[85%]" />
          ))}
        </Card>
        <Card className="p-[22px]">
          <Bone className="mb-3.5 h-[30px] w-[280px] rounded-[10px]" />
          <div className="border-b border-parchment-edge-strong pb-[9px]">
            <Bone className="h-2.5 w-1/2" />
          </div>
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[46px_1.3fr_1.1fr_110px_70px] items-center gap-3 border-b border-parchment-edge px-1 py-3"
            >
              <Bone className="h-4 w-6" />
              <Bone className="h-4 w-3/4" />
              <Bone className="h-3.5 w-2/3" />
              <Bone className="h-2.5 w-12" />
              <div className="flex justify-end gap-1">
                <Bone className="h-[26px] w-[26px] rounded-[7px]" />
                <Bone className="h-[26px] w-[26px] rounded-[7px]" />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
