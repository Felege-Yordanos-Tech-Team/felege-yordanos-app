'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
    <div className="mt-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by title or number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Badge
          variant={activeCategory === null ? 'default' : 'outline'}
          className="cursor-pointer shrink-0"
          onClick={() => setActiveCategory(null)}
        >
          All
        </Badge>
        {categories.map((cat) => (
          <Badge
            key={cat.id}
            variant={activeCategory === cat.name ? 'default' : 'outline'}
            className="cursor-pointer shrink-0"
            onClick={() =>
              setActiveCategory(
                activeCategory === cat.name ? null : cat.name
              )
            }
          >
            {cat.emoji} {cat.name}
          </Badge>
        ))}
      </div>

      <Separator />

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No songs found
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((song) => (
            <Link key={song.id} href={`/songbook/${song.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center gap-4 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {song.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{song.title}</p>
                    {song.title_en && (
                      <p className="truncate text-sm text-muted-foreground">
                        {song.title_en}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {song.category}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
