'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import type { Database } from '@felege-yordanos/db';

type Song = Database['public']['Tables']['songs']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface SongListProps {
  songs: Song[];
  categories: Category[];
}

export function SongList({ songs, categories }: SongListProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = songs.filter((song) => {
    const matchesSearch =
      !search ||
      song.title.toLowerCase().includes(search.toLowerCase()) ||
      song.title_en?.toLowerCase().includes(search.toLowerCase()) ||
      song.number.toString() === search;

    const matchesCategory =
      !activeCategory || song.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="mt-6 space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search by title, number, or lyrics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border-none bg-surface-container-high px-4 pl-12 py-3.5 text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategory(null)}
          className={`shrink-0 rounded-full px-6 py-2.5 text-xs font-label font-semibold transition-colors ${
            activeCategory === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-surface-container-high text-foreground hover:bg-surface-container'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              setActiveCategory(
                activeCategory === cat.name ? null : cat.name
              )
            }
            className={`shrink-0 rounded-full px-6 py-2.5 text-xs font-label font-semibold transition-colors ${
              activeCategory === cat.name
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-container-high text-foreground hover:bg-surface-container'
            }`}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      {/* Song list */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No songs found
        </p>
      ) : (
        <div className="space-y-1">
          {filtered.map((song) => (
            <Link key={song.id} href={`/songbook/${song.id}`}>
              <article className="group flex items-center gap-4 rounded-xl p-4 transition-all hover:bg-surface-container-low tibeb-accent">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-container-high font-headline text-xl text-primary">
                  {String(song.number).padStart(2, '0')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-headline text-lg text-primary truncate">{song.title}</p>
                  {song.title_en && (
                    <p className="text-xs text-muted-foreground truncate">{song.title_en}</p>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-label hidden sm:block">
                  {song.category}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
