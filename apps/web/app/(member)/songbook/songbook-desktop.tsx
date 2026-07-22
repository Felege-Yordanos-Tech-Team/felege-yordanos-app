'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Bookmark, Play, Printer, Search } from 'lucide-react';
import type { Database } from '@felege-yordanos/db';

type Song = Database['public']['Tables']['songs']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

const FALLBACK_DOTS = ['#D4A843', '#6B1D2A', '#8B2F3F', '#4F7B3E', '#C97B1A', '#A47A18'];

/**
 * Desktop songbook — master/detail: a scrollable list pane on the left and the
 * selected song's lyrics on the right. Mobile keeps the existing SongList +
 * per-song route; this renders only at md+.
 */
export function SongbookDesktop({
  songs,
  categories,
  className,
}: {
  songs: Song[];
  categories: Category[];
  className?: string;
}) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | string | null>(songs[0]?.id ?? null);

  const colorByCategory = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c, i) => map.set(c.name, c.color || FALLBACK_DOTS[i % FALLBACK_DOTS.length]));
    return map;
  }, [categories]);

  const filtered = songs.filter((s) => {
    const matchesSearch =
      !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.title_en?.toLowerCase().includes(search.toLowerCase()) ||
      s.number.toString() === search;
    const matchesCategory = !activeCategory || s.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const selected = songs.find((s) => s.id === selectedId) ?? filtered[0] ?? songs[0] ?? null;
  const verses = (selected?.lyrics ?? '')
    .split(/\n\s*\n/)
    .map((v) => v.trim())
    .filter(Boolean);

  return (
    <div className={className}>
      <div className="grid h-[calc(100vh-6.75rem)] min-h-[560px] grid-cols-[350px_1fr] items-stretch gap-4">
        {/* ── Left: list pane ── */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-fy-sm">
          <div className="p-5 pb-0">
            <div className="flex items-end justify-between">
              <div>
                <div className="font-ethiopic text-[26px] font-bold leading-none text-burgundy dark:text-gold">
                  መዝሙር
                </div>
                <div className="mt-0.5 font-display text-[13px] italic text-muted-foreground">Songbook</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[11px] text-gold-deep dark:text-gold">{songs.length}</div>
                <div className="text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground">songs</div>
              </div>
            </div>

            {/* Search */}
            <div className="my-3 flex items-center gap-2 rounded-[10px] border border-border bg-background px-[11px] py-2">
              <Search className="h-[13px] w-[13px] shrink-0 text-ink-faint" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Title, number, or lyrics…"
                className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-ink-faint"
              />
            </div>

            {/* Category pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className={`shrink-0 rounded-full px-3 py-[5px] text-[11px] transition-colors ${
                  activeCategory === null
                    ? 'bg-burgundy font-semibold text-cream'
                    : 'border border-border bg-card font-medium text-foreground hover:bg-card/80'
                }`}
              >
                All
              </button>
              {categories.slice(0, 3).map((c) => {
                const active = activeCategory === c.name;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCategory(active ? null : c.name)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-[5px] text-[11px] transition-colors ${
                      active
                        ? 'bg-burgundy font-semibold text-cream'
                        : 'border border-border bg-card font-medium text-foreground hover:bg-card/80'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: colorByCategory.get(c.name) ?? '#D4A843' }} />
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable song list */}
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-2.5">
            {filtered.map((song) => {
              const active = song.id === selected?.id;
              return (
                <button
                  key={song.id}
                  type="button"
                  onClick={() => setSelectedId(song.id)}
                  className={`relative mb-0.5 flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left transition-colors ${
                    active ? 'bg-burgundy/[0.07] dark:bg-gold/[0.12]' : 'hover:bg-card/80'
                  }`}
                >
                  {active && (
                    <span className="absolute inset-y-2 left-0 w-[2.5px] rounded bg-gold shadow-[0_0_8px_#D4A843]" />
                  )}
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-display text-sm font-semibold ${
                      active
                        ? 'sacred-gradient border-gold/40 text-gold'
                        : 'border-border bg-gradient-to-br from-parchment-soft to-parchment-deep text-burgundy dark:from-[#2D1B0E] dark:to-[#1A0F08] dark:text-gold'
                    }`}
                  >
                    {String(song.number).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-ethiopic text-[13.5px] font-semibold text-burgundy-ink dark:text-cream">
                      {song.title}
                    </span>
                    {song.title_en && (
                      <span className="block truncate font-display text-[11.5px] italic text-muted-foreground">
                        {song.title_en}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-[8.5px] font-semibold uppercase tracking-[0.12em] text-gold-deep dark:text-gold">
                    {song.category}
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">No songs found</p>
            )}
          </div>
        </div>

        {/* ── Right: detail pane ── */}
        <div className="overflow-y-auto rounded-2xl border border-border bg-card p-[30px] shadow-fy-sm">
          {selected ? (
            <div className="max-w-[640px]">
              <div className="flex items-start gap-4">
                <div className="sacred-gradient flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[14px] border border-gold/30 shadow-fy-md">
                  <span className="font-display text-[26px] font-medium text-gold">
                    {String(selected.number).padStart(2, '0')}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-ethiopic text-[28px] font-semibold leading-tight text-burgundy-ink dark:text-cream">
                    {selected.title}
                  </div>
                  {selected.title_en && (
                    <div className="mt-0.5 font-display text-base italic text-muted-foreground">
                      {selected.title_en}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-burgundy/[0.08] px-2.5 py-1 text-[11px] font-medium text-burgundy dark:bg-gold/[0.12] dark:text-gold-light">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  {selected.category}
                </span>
                {selected.audio_url && (
                  <a
                    href={selected.audio_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-gold/35 bg-burgundy px-3 py-1.5 text-[11px] font-semibold text-cream shadow-fy-sm hover:opacity-95"
                  >
                    <Play className="h-[11px] w-[11px] text-gold" fill="currentColor" />
                    Play recording
                  </a>
                )}
                <Link
                  href={`/songbook/${selected.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1.5 text-gold-deep hover:bg-card/80 dark:text-gold"
                  aria-label="Open full page"
                >
                  <Bookmark className="h-[13px] w-[13px]" />
                </Link>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1.5 text-gold-deep hover:bg-card/80 dark:text-gold"
                  aria-label="Print"
                >
                  <Printer className="h-[13px] w-[13px]" />
                </button>
              </div>

              {/* Lyrics */}
              <div className="mt-[22px] rounded-2xl border border-border bg-cream px-7 pb-7 pt-6 dark:bg-[#2D1B0E]">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep dark:text-gold">
                    Lyrics
                  </span>
                  <span className="font-ethiopic text-sm text-gold opacity-60">✣</span>
                </div>
                <div className="font-ethiopic text-[17px] font-medium leading-[1.9] text-foreground">
                  {verses.map((verse, i) => (
                    <div key={i}>
                      {i > 0 && (
                        <div className="my-[22px] flex items-center justify-center gap-2">
                          <span className="h-px w-9 bg-border" />
                          <span className="flex items-center gap-1">
                            <span className="h-[3px] w-[3px] rounded-full bg-gold opacity-40" />
                            <span className="h-[3px] w-[3px] rounded-full bg-gold" />
                            <span className="h-[3px] w-[3px] rounded-full bg-gold opacity-40" />
                          </span>
                          <span className="h-px w-9 bg-border" />
                        </div>
                      )}
                      <p className="whitespace-pre-line">
                        {i === 0 && verse.length > 0 ? (
                          <>
                            <span className="float-left mr-2.5 mt-1 font-display text-[56px] font-medium leading-[0.85] text-burgundy dark:text-gold">
                              {verse[0]}
                            </span>
                            {verse.slice(1)}
                          </>
                        ) : (
                          verse
                        )}
                      </p>
                    </div>
                  ))}
                  {verses.length === 0 && (
                    <p className="italic text-muted-foreground">No lyrics available.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">Select a song to view lyrics.</p>
          )}
        </div>
      </div>
    </div>
  );
}
