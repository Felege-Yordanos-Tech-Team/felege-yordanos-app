'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type {
  categories as categoriesTable,
  songs as songsTable,
} from '@felege-yordanos/db/schema';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createSong, updateSong } from './actions';

type Song = typeof songsTable.$inferSelect;
type Category = typeof categoriesTable.$inferSelect;

interface SongFormProps {
  categories: Category[];
  song?: Song | null;
}

const LYRICS_MAX = 8000;

export function SongForm({ categories, song }: SongFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!song;

  const [number, setNumber] = useState(song?.number?.toString() ?? '');
  const [title, setTitle] = useState(song?.title ?? '');
  const [titleEn, setTitleEn] = useState(song?.titleEn ?? '');
  const [category, setCategory] = useState(song?.category ?? '');
  const [lyrics, setLyrics] = useState(song?.lyrics ?? '');
  const [audioUrl, setAudioUrl] = useState(song?.audioUrl ?? '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = { number, title, titleEn, category, lyrics, audioUrl };

    const res = song
      ? await updateSong(song.id, payload)
      : await createSong(payload);

    setLoading(false);

    if (!res.ok) {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    } else {
      toast({ title: isEdit ? 'Song updated' : 'Song created' });
      router.push('/admin/songs');
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4">
      <Link
        href="/admin/songs"
        className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep transition-colors hover:text-burgundy dark:text-gold dark:hover:text-gold-light"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Songs
      </Link>

      <div className="font-ethiopic text-xs font-medium tracking-[0.06em] text-gold-deep dark:text-gold">
        {isEdit ? 'መዝሙር አርትዕ' : 'አዲስ መዝሙር'}
      </div>
      <h1 className="mt-0.5 font-display text-[28px] font-medium leading-[1.05] text-burgundy-ink dark:text-cream">
        {isEdit ? 'Edit song' : 'New song'}
      </h1>

      {/* Ornament rule */}
      <div className="my-4 flex items-center gap-2.5">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-parchment-edge dark:to-ink-muted/40" />
        <span className="flex items-center gap-1">
          <span className="h-1 w-1 rounded-full bg-gold opacity-40" />
          <span className="h-1 w-1 rounded-full bg-gold" />
          <span className="h-1 w-1 rounded-full bg-gold opacity-40" />
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-parchment-edge dark:to-ink-muted/40" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Number + Category */}
        <div
          className="grid gap-2.5"
          style={{ gridTemplateColumns: '100px 1fr' }}
        >
          <div className="space-y-1.5">
            <Label
              htmlFor="number"
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold"
            >
              Number
            </Label>
            <Input
              id="number"
              type="number"
              required
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="1"
              className="rounded-[10px] border border-border bg-card font-mono text-sm font-semibold tabular-nums text-burgundy-ink dark:text-cream focus-visible:ring-2 focus-visible:ring-gold/30"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger className="rounded-[10px] border border-border bg-card text-[13px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: cat.color || '#D4A843' }}
                      />
                      {cat.emoji ? `${cat.emoji} ` : ''}
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Amharic title */}
        <div className="space-y-1.5">
          <Label
            htmlFor="title"
            className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold"
          >
            Title · ርዕስ (Amharic)
          </Label>
          <Input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="የመዝሙር ስም"
            className="rounded-[10px] border border-border bg-card font-ethiopic text-[14px] font-medium text-burgundy-ink dark:text-cream focus-visible:ring-2 focus-visible:ring-gold/30"
          />
        </div>

        {/* English title */}
        <div className="space-y-1.5">
          <Label
            htmlFor="titleEn"
            className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold"
          >
            Title · English (optional)
          </Label>
          <Input
            id="titleEn"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder="Song title in English"
            className="rounded-[10px] border border-border bg-card font-display text-[14px] italic focus-visible:ring-2 focus-visible:ring-gold/30"
          />
        </div>

        {/* Lyrics */}
        <div className="space-y-1.5">
          <Label
            htmlFor="lyrics"
            className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold"
          >
            Lyrics · ግጥም
          </Label>
          <Textarea
            id="lyrics"
            required
            rows={12}
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value.slice(0, LYRICS_MAX))}
            placeholder="የመዝሙር ግጥም…"
            className="min-h-[180px] rounded-xl border border-border bg-card px-4 py-3.5 font-ethiopic text-sm leading-[1.8] text-foreground placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-gold/30"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Use blank lines to separate verses</span>
            <span className="font-mono">
              {lyrics.length} / {LYRICS_MAX.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Audio URL */}
        <div className="space-y-1.5">
          <Label
            htmlFor="audioUrl"
            className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold"
          >
            Audio URL{' '}
            <span className="font-normal normal-case tracking-normal text-ink-faint">
              · optional
            </span>
          </Label>
          <Input
            id="audioUrl"
            type="url"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            placeholder="https://…"
            className="rounded-[10px] border border-border bg-card font-mono text-[12.5px] focus-visible:ring-2 focus-visible:ring-gold/30"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/songs')}
            className="flex-1 rounded-xl border border-border bg-card font-semibold text-burgundy hover:bg-card/80 dark:text-gold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="sacred-gradient flex flex-1 items-center justify-center gap-2 rounded-xl border border-gold/40 py-3 text-sm font-semibold text-cream shadow-fy-md hover:opacity-95"
          >
            <span className="font-ethiopic text-xs opacity-85">አስቀምጥ</span>
            <span className="h-3.5 w-px bg-gold/40" />
            <span>{loading ? 'Saving…' : isEdit ? 'Update' : 'Save song'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
