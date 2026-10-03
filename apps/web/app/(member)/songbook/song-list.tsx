'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type {
  categories as categoriesTable,
  songs as songsTable,
} from '@felege-yordanos/db/schema';

type Song = typeof songsTable.$inferSelect;
type Category = typeof categoriesTable.$inferSelect;

interface SongListProps {
  songs: Song[];
  categories: Category[];
}

const FALLBACK_DOTS = [
  '#D4A843',
  '#6B1D2A',
  '#8B2F3F',
  '#4F7B3E',
  '#C97B1A',
  '#A47A18',
];

export function SongList({ songs, categories }: SongListProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const colorByCategory = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((cat, i) => {
      map.set(cat.name, cat.color || FALLBACK_DOTS[i % FALLBACK_DOTS.length]);
    });
    return map;
  }, [categories]);

  const filtered = songs.filter((song) => {
    const matchesSearch =
      !search ||
      song.title.toLowerCase().includes(search.toLowerCase()) ||
      song.titleEn?.toLowerCase().includes(search.toLowerCase()) ||
      song.number?.toString() === search;

    const matchesCategory = !activeCategory || song.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-3.5">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-ink-faint" />
        <Input
          placeholder="Search by title, number, or lyrics…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl border border-border bg-card py-[11px] pl-[38px] pr-3.5 text-[13px] text-foreground placeholder:text-ink-faint shadow-[inset_0_1px_2px_rgba(74,14,24,0.04)] focus-visible:ring-2 focus-visible:ring-gold/30"
        />
      </div>

      {/* Category pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11.5px] transition-colors ${
            activeCategory === null
              ? 'border-transparent bg-burgundy font-semibold text-cream'
              : 'border border-border bg-card font-medium text-foreground hover:bg-card/80'
          }`}
        >
          All
        </button>
        {categories.map((cat) => {
          const active = activeCategory === cat.name;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(active ? null : cat.name)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11.5px] transition-colors ${
                active
                  ? 'border-transparent bg-burgundy font-semibold text-cream'
                  : 'border border-border bg-card font-medium text-foreground hover:bg-card/80'
              } flex items-center gap-1.5`}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: colorByCategory.get(cat.name) ?? '#D4A843',
                }}
              />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Song list */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No songs found
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filtered.map((song) => (
            <Link
              key={song.id}
              href={`/songbook/${song.id}`}
              className="gold-accent-l relative flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 pl-4 transition-colors hover:bg-card/80"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-border bg-gradient-to-br from-parchment-soft to-parchment-deep dark:from-[#2D1B0E] dark:to-[#1A0F08]">
                <span className="font-display text-[18px] font-semibold tabular-nums text-burgundy dark:text-gold">
                  {song.number != null
                    ? String(song.number).padStart(2, '0')
                    : ''}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-ethiopic text-[16px] font-semibold leading-tight text-burgundy-ink dark:text-cream">
                  {song.title}
                </div>
                {song.titleEn && (
                  <div className="font-display text-[12.5px] italic text-muted-foreground">
                    {song.titleEn}
                  </div>
                )}
              </div>
              <span className="shrink-0 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-gold-deep dark:text-gold">
                {song.category}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
