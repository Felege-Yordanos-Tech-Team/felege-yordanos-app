import { Megaphone } from 'lucide-react';
import { Card, PageHead } from '@/components/ds';
import { getLocale, getT } from '@/lib/i18n/server';
import { cn } from '@/lib/utils';

// Notice board: not built yet.
// Header matches the design; the body is an honest empty state.
export default async function NoticesPage() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return (
    <div className="px-[22px] pb-6 pt-4 md:px-7 md:py-7">
      <PageHead
        en="Notice board"
        am="የማስታወቂያ ሰሌዳ"
        sub="Announcements from the parish council and departments"
      />
      <Card className="relative flex flex-col items-center overflow-hidden px-6 py-16 text-center md:py-20">
        <div
          className="tibeb-gold pointer-events-none absolute inset-0 opacity-40"
          aria-hidden
        />
        <div className="relative mb-4 rounded-full border border-gold/30 bg-gold/10 p-3.5 text-gold-deep">
          <Megaphone className="h-6 w-6" />
        </div>
        <p
          className={cn(
            'relative leading-tight text-brand-ink',
            locale === 'am'
              ? 'font-ethiopic text-[19px] font-semibold'
              : 'font-display text-[22px] font-medium',
          )}
        >
          {t('No notices yet')}
        </p>
        <p className="relative mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-ink-muted">
          {t(
            'Announcements from the parish council and departments will appear here.',
          )}
        </p>
      </Card>
    </div>
  );
}
