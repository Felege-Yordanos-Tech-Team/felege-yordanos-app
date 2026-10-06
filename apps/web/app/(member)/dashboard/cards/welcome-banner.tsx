import { BadgeCheck, Clock } from 'lucide-react';
import { getLocale, getT } from '@/lib/i18n/server';
import { cn } from '@/lib/utils';
import { hasEthiopic, shortDate } from '../format';

interface NextEvent {
  title: string;
  eventDate: string;
  startTime: string | null;
}

interface WelcomeBannerProps {
  firstName: string;
  /** Shown as the ID chip only when the user has a linked member record. */
  memberId: string | null;
  memberDeptName: string | null;
  nextEvent: NextEvent | null;
  variant: 'mobile' | 'desktop';
}

/** Hero greeting. */
export async function WelcomeBanner({
  firstName,
  memberId,
  memberDeptName,
  nextEvent,
  variant,
}: WelcomeBannerProps) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const desktop = variant === 'desktop';
  const am = locale === 'am';

  return (
    <section
      className={cn(
        'sacred-gradient relative overflow-hidden rounded-[20px] text-cream',
        desktop
          ? 'flex items-center gap-6 border border-gold/30 px-8 py-[26px] shadow-[0_10px_30px_-14px_rgba(10,60,54,0.5)]'
          : 'px-5 pb-[22px] pt-5 shadow-[0_10px_28px_-12px_rgba(10,60,54,0.4)]',
      )}
    >
      <div
        className={cn(
          'tibeb-gold pointer-events-none absolute inset-0',
          desktop ? 'opacity-60' : 'opacity-50',
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute rounded-full blur-[8px]',
          desktop
            ? 'right-[180px] top-[-40px] h-[220px] w-[220px] bg-[radial-gradient(circle,rgba(212,168,67,0.18),transparent_70%)]'
            : 'right-[-30px] top-[-30px] h-40 w-40 bg-[radial-gradient(circle,rgba(212,168,67,0.32)_0%,transparent_60%)]',
        )}
      />

      <div className="relative min-w-0 flex-1">
        <div
          className={cn(
            'mb-1 text-xs tracking-[0.05em] text-gold-light',
            am ? 'font-display text-[13px] italic' : 'font-ethiopic',
          )}
        >
          {am ? 'Welcome' : 'እንኳን ደህና መጡ'}
        </div>
        <h1
          className={cn(
            'leading-[1.05] text-cream',
            am ? 'font-ethiopic font-semibold' : 'font-display font-medium',
            desktop
              ? am
                ? 'text-[32px]'
                : 'text-[36px]'
              : am
                ? 'text-[27px]'
                : 'text-[32px]',
          )}
        >
          {t('Welcome,')}{' '}
          <em
            className={cn(
              'text-gold',
              hasEthiopic(firstName)
                ? 'font-ethiopic not-italic'
                : 'font-display italic',
            )}
          >
            {firstName}
          </em>
        </h1>
        {memberId && (
          <div className="mt-2.5 flex w-fit items-center gap-1.5 rounded-full border border-gold/35 bg-gold/[0.18] px-2.5 py-1">
            <BadgeCheck
              className="h-[11px] w-[11px] text-gold"
              strokeWidth={2.25}
            />
            <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-gold">
              {memberId}
            </span>
            {memberDeptName && (
              <span className="ml-0.5 font-ethiopic text-[10px] text-gold-light/65">
                · {memberDeptName}
              </span>
            )}
          </div>
        )}
      </div>

      {desktop && nextEvent && (
        <div className="relative hidden min-w-[210px] max-w-[300px] shrink-0 border-l border-gold/30 pl-6 lg:block">
          <div className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-gold-light/75">
            {t('Next event')}
          </div>
          <div
            className={cn(
              'line-clamp-2 leading-[1.1] text-cream',
              hasEthiopic(nextEvent.title)
                ? 'font-ethiopic text-lg font-semibold'
                : 'font-display text-[21px] font-medium',
            )}
          >
            {nextEvent.title}
          </div>
          <div className="mt-1.5 flex items-center gap-2 font-mono text-[11px] text-gold-light">
            <Clock className="h-[11px] w-[11px]" />
            {shortDate(nextEvent.eventDate, locale)}
            {nextEvent.startTime && ` · ${nextEvent.startTime.slice(0, 5)}`}
          </div>
        </div>
      )}
    </section>
  );
}
