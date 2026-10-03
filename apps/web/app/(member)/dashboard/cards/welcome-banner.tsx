import { BadgeCheck, CalendarClock } from 'lucide-react';
import { formatShortDate } from '@/lib/format';

interface NextEvent {
  title: string;
  eventDate: string;
  startTime: string | null;
}

interface WelcomeBannerProps {
  firstName: string;
  memberId: string | null;
  memberDeptName: string | null;
  nextEvent: NextEvent | null;
}

/** Desktop welcome banner: greeting + member ID on the left, next event on the right. */
export function WelcomeBanner({
  firstName,
  memberId,
  memberDeptName,
  nextEvent,
}: WelcomeBannerProps) {
  return (
    <section className="sacred-gradient relative overflow-hidden rounded-[20px] px-7 py-6 text-cream shadow-fy-lg">
      <div className="tibeb-gold absolute inset-0 opacity-50" />
      <div
        className="absolute -right-10 -top-10 h-52 w-52"
        style={{
          background:
            'radial-gradient(circle, rgba(212,168,67,0.30) 0%, transparent 60%)',
          filter: 'blur(10px)',
        }}
      />
      <div className="relative flex items-center justify-between gap-6">
        <div className="min-w-0">
          <div className="mb-1 font-ethiopic text-xs tracking-wider text-gold-light">
            እንኳን ደህና መጡ
          </div>
          <h1 className="font-display text-[38px] font-medium leading-none text-cream">
            Welcome, <em className="text-gold">{firstName}</em>
          </h1>
          {memberId && (
            <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-gold/35 bg-gold/[0.18] px-2.5 py-1">
              <BadgeCheck className="h-3 w-3 text-gold" strokeWidth={2.25} />
              <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-gold">
                {memberId}
              </span>
              {memberDeptName && (
                <span className="font-ethiopic text-[10px] text-gold-light/65">
                  · {memberDeptName}
                </span>
              )}
            </div>
          )}
        </div>

        {nextEvent && (
          <div className="hidden shrink-0 border-l border-cream/15 pl-6 lg:block">
            <div className="mb-1.5 flex items-center gap-1.5 font-label text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-light/70">
              <CalendarClock className="h-3 w-3" />
              Next event
            </div>
            <div className="font-display text-xl font-medium leading-tight text-cream">
              {nextEvent.title}
            </div>
            <div className="mt-1 font-mono text-[11px] text-cream/60">
              {formatShortDate(nextEvent.eventDate)}
              {nextEvent.startTime && ` · ${nextEvent.startTime.slice(0, 5)}`}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
