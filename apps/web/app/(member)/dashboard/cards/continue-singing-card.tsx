import Link from 'next/link';
import { Play, ArrowRight } from 'lucide-react';

/**
 * PLACEHOLDER — "recent songs" history isn't tracked yet, so this shows a
 * static preview. Swap `PLACEHOLDER_SONGS` for a real recent/continue query
 * once play history exists. UI is intentionally kept simple so that's a
 * drop-in change.
 */
const PLACEHOLDER_SONGS = [
  { no: '07', titleAm: 'መድኃኒዓለም', titleEn: 'Saviour of the World' },
  { no: '12', titleAm: 'ለማርያም ምስጋና', titleEn: 'Praise to Mary' },
  { no: '18', titleAm: 'ኪዳነ ምሕረት', titleEn: 'Covenant of Mercy' },
];

export function ContinueSingingCard() {
  return (
    <section className="gold-accent-t rounded-2xl border border-border bg-card p-5 shadow-fy-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <div className="font-ethiopic text-[11px] font-medium tracking-[0.08em] text-gold-deep dark:text-gold">
            መዝሙር
          </div>
          <h2 className="font-display text-[22px] font-medium leading-none text-burgundy-ink dark:text-cream">
            Continue singing
          </h2>
        </div>
        <Link
          href="/songbook"
          className="inline-flex items-center gap-1 text-xs font-medium text-gold-deep hover:underline dark:text-gold"
        >
          Open songbook
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ul className="space-y-1">
        {PLACEHOLDER_SONGS.map((song) => (
          <li key={song.no}>
            <Link
              href="/songbook"
              className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-burgundy/[0.04] dark:hover:bg-gold/[0.06]"
            >
              <span className="w-6 shrink-0 text-center font-mono text-[11px] text-muted-foreground">
                {song.no}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-ethiopic text-[15px] font-medium text-burgundy-ink dark:text-cream">
                  {song.titleAm}
                </span>
                <span className="block truncate font-display text-[12px] italic text-muted-foreground">
                  {song.titleEn}
                </span>
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-burgundy/[0.06] text-burgundy transition-colors group-hover:bg-gold group-hover:text-burgundy-ink dark:bg-gold/[0.12] dark:text-gold">
                <Play className="h-3.5 w-3.5 translate-x-[1px]" fill="currentColor" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
