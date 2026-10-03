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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHead } from '@/components/ds';
import { useToast } from '@/hooks/use-toast';
import { useLocale, useT } from '@/lib/i18n/client';
import { intlLocale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';
import { categoryDotMap, hasEthiopic } from '@/lib/category-color';
import { createSong, updateSong } from './actions';

type Song = typeof songsTable.$inferSelect;
type Category = typeof categoriesTable.$inferSelect;

interface SongFormProps {
  categories: Category[];
  song?: Song | null;
}

const LYRICS_MAX = 8000;

const FIELD_LABEL =
  'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep';
const FIELD =
  'h-auto rounded-[10px] border border-solid border-parchment-edge bg-parchment-soft md:bg-parchment px-3.5 py-[11px] text-[13px] text-ink shadow-[inset_0_1px_2px_rgba(10,60,54,0.04)] placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-gold/30 dark:bg-parchment-deep dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]';

export function SongForm({ categories, song }: SongFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useT();
  const locale = useLocale();
  const isEdit = !!song;
  const dots = categoryDotMap(categories);

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
      toast({
        title: t('Error'),
        description: t(res.error),
        variant: 'destructive',
      });
    } else {
      toast({ title: isEdit ? t('Song updated') : t('Song created') });
      router.push('/admin/songs');
      router.refresh();
    }
  }

  const fmt = new Intl.NumberFormat(intlLocale(locale));

  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4 md:mx-0 md:max-w-[760px] md:px-7 md:py-7">
      <Link
        href="/admin/songs"
        className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep transition-colors hover:text-brand dark:hover:text-gold-light"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('Songs')}
      </Link>

      <PageHead en={isEdit ? 'Edit song' : 'New song'} className="mb-0" />

      {/* Ornament rule */}
      <div className="my-4 flex items-center gap-2.5" aria-hidden>
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-parchment-edge" />
        <span className="flex items-center gap-[3.6px]">
          <span className="h-[3px] w-[3px] rounded-full bg-gold opacity-40" />
          <span className="h-[3px] w-[3px] rounded-full bg-gold" />
          <span className="h-[3px] w-[3px] rounded-full bg-gold opacity-40" />
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-parchment-edge" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-3.5 md:rounded-2xl md:border md:border-parchment-edge md:bg-parchment-soft md:p-7 md:shadow-[0_1px_0_rgba(10,60,54,0.04),0_4px_14px_-8px_rgba(10,60,54,0.12)] md:dark:shadow-[0_4px_14px_-8px_rgba(0,0,0,0.4)]"
      >
        {/* Number + Category */}
        <div className="grid grid-cols-[100px_1fr] gap-2.5">
          <div>
            <Label htmlFor="number" className={FIELD_LABEL}>
              {t('Number')}
            </Label>
            <Input
              id="number"
              type="number"
              required
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="1"
              className={cn(
                FIELD,
                'font-mono text-sm font-semibold tabular-nums text-brand-ink',
              )}
            />
          </div>
          <div>
            <Label htmlFor="category" className={FIELD_LABEL}>
              {t('Category')}
            </Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger
                id="category"
                className={cn(
                  FIELD,
                  'focus:ring-2 focus:ring-gold/30 focus:ring-offset-0',
                  hasEthiopic(category) && 'font-ethiopic',
                )}
              >
                <SelectValue placeholder={t('Select category')} />
              </SelectTrigger>
              <SelectContent className="border-parchment-edge bg-parchment-soft">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    <span
                      className={cn(
                        'flex items-center gap-2',
                        hasEthiopic(cat.name) && 'font-ethiopic',
                      )}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: dots.get(cat.name) }}
                      />
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Amharic title */}
        <div>
          <Label htmlFor="title" className={FIELD_LABEL}>
            {t('Title · Amharic')}
          </Label>
          <Input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="የመዝሙር ስም"
            className={cn(
              FIELD,
              'font-ethiopic text-sm font-medium text-brand-ink',
            )}
          />
        </div>

        {/* English title */}
        <div>
          <Label htmlFor="titleEn" className={FIELD_LABEL}>
            {t('Title · English (optional)')}
          </Label>
          <Input
            id="titleEn"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder={t('Song title in English')}
            className={cn(FIELD, 'font-display text-[15px] italic')}
          />
        </div>

        {/* Lyrics */}
        <div>
          <Label htmlFor="lyrics" className={FIELD_LABEL}>
            {t('Lyrics')}
          </Label>
          <Textarea
            id="lyrics"
            required
            rows={12}
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value.slice(0, LYRICS_MAX))}
            placeholder="የመዝሙር ግጥም…"
            className={cn(
              FIELD,
              'min-h-[180px] rounded-xl px-4 py-3.5 font-ethiopic text-sm leading-[1.8] focus-visible:ring-offset-0',
            )}
          />
          <div className="mt-1 flex justify-between text-[10px] text-ink-muted">
            <span>{t('Use blank lines to separate verses')}</span>
            <span className="font-mono">
              {fmt.format(lyrics.length)} / {fmt.format(LYRICS_MAX)}
            </span>
          </div>
        </div>

        {/* Audio URL */}
        <div>
          <Label htmlFor="audioUrl" className={FIELD_LABEL}>
            {t('Audio URL')} · {t('optional')}
          </Label>
          <Input
            id="audioUrl"
            type="url"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            placeholder="https://…"
            className={cn(FIELD, 'font-mono text-[12.5px]')}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => router.push('/admin/songs')}
            className="flex-1 rounded-[10px] border border-parchment-edge bg-parchment-soft px-3.5 py-3 text-[12.5px] font-semibold text-brand transition-colors hover:bg-parchment-deep dark:text-gold md:bg-parchment md:dark:bg-parchment-deep"
          >
            {t('Cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="sacred-gradient flex flex-1 items-center justify-center gap-2 rounded-xl border border-gold/40 px-5 py-3 text-[13px] font-semibold tracking-[0.04em] text-cream shadow-[0_6px_16px_-6px_rgba(10,60,54,0.4),inset_0_1px_0_rgba(212,168,67,0.25)] transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            {locale !== 'am' && (
              <>
                <span className="font-ethiopic text-xs opacity-85">አስቀምጥ</span>
                <span className="h-3.5 w-px bg-gold/40" />
              </>
            )}
            <span>
              {loading
                ? t('Saving…')
                : isEdit
                  ? t('Save changes')
                  : t('Save song')}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
