import { cn } from '@/lib/utils';

/** Gold dot triplet between hairlines. */
function VerseDivider({ wide }: { wide?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2',
        wide ? 'my-[22px]' : 'my-5',
      )}
      aria-hidden
    >
      <span className={cn('h-px bg-parchment-edge', wide ? 'w-9' : 'w-8')} />
      <span className="flex items-center gap-[3.6px]">
        <span className="h-[3px] w-[3px] rounded-full bg-gold opacity-40" />
        <span className="h-[3px] w-[3px] rounded-full bg-gold" />
        <span className="h-[3px] w-[3px] rounded-full bg-gold opacity-40" />
      </span>
      <span className={cn('h-px bg-parchment-edge', wide ? 'w-9' : 'w-8')} />
    </div>
  );
}

/** Splits lyrics into verses on blank lines (line breaks inside a verse are kept). */
export function splitVerses(lyrics: string | null | undefined): string[] {
  return (lyrics ?? '')
    .split(/\n\s*\n/)
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Lyrics card with the design's drop cap on the first verse.
 * `lg` is the desktop detail pane (cream card, 17px), `md` the phone page (16px).
 */
export function LyricsCard({
  lyrics,
  label,
  emptyLabel,
  size = 'md',
}: {
  lyrics: string | null | undefined;
  label: string;
  emptyLabel: string;
  size?: 'md' | 'lg';
}) {
  const verses = splitVerses(lyrics);
  const lg = size === 'lg';
  return (
    <article
      className={cn(
        'rounded-2xl border border-parchment-edge',
        lg
          ? 'mt-[22px] bg-cream px-7 pb-7 pt-6 dark:bg-white/[0.035]'
          : 'mt-[18px] bg-parchment-soft px-[22px] pb-6 pt-5',
      )}
    >
      <header
        className={cn(
          'flex items-center justify-between',
          lg ? 'mb-4' : 'mb-3.5',
        )}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep">
          {label}
        </span>
        <span
          className="font-ethiopic text-sm text-gold opacity-60"
          aria-hidden
        >
          ✣
        </span>
      </header>

      <div
        className={cn(
          'font-ethiopic font-medium text-ink',
          lg ? 'text-[17px]/[1.9]' : 'text-base/[1.85]',
        )}
      >
        {verses.map((verse, i) => {
          const chars = Array.from(verse);
          return (
            <div key={i}>
              {i > 0 && <VerseDivider wide={lg} />}
              <p className="whitespace-pre-line">
                {i === 0 ? (
                  <>
                    <span
                      className={cn(
                        'float-left mt-1 font-display font-medium text-brand dark:text-gold',
                        lg ? 'mr-2.5 text-[56px]' : 'mr-2 text-[52px]',
                        // after the size: tailwind-merge drops a leading-* that comes before text-[size]
                        'leading-[0.85]',
                      )}
                    >
                      {chars[0]}
                    </span>
                    {chars.slice(1).join('')}
                  </>
                ) : (
                  verse
                )}
              </p>
            </div>
          );
        })}
        {verses.length === 0 && (
          <p className="text-sm italic text-ink-muted">{emptyLabel}</p>
        )}
      </div>
    </article>
  );
}
