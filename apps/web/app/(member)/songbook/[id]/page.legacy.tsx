import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AudioPill } from './audio-pill';

type Song = Database['public']['Tables']['songs']['Row'];

export default async function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const { data } = await supabase
    .from('songs')
    .select('*')
    .eq('id', id)
    .single();

  const song = data as Song | null;
  if (!song) notFound();

  // Split lyrics into verses on blank-line separators (preserve original layout otherwise)
  const verses = song.lyrics
    .split(/\n\s*\n/)
    .map((v) => v.trim())
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-[14px]">
      {/* Back link */}
      <Link
        href="/songbook"
        className="mb-3.5 inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep transition-colors hover:text-burgundy dark:text-gold dark:hover:text-gold-light"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to songbook
      </Link>

      {/* Title row */}
      <div className="flex items-start gap-3.5">
        <div
          className="sacred-gradient flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] shadow-fy-md"
          style={{ border: '1px solid rgba(212,168,67,0.3)' }}
        >
          <span className="font-display text-2xl font-medium tabular-nums text-gold">
            {String(song.number).padStart(2, '0')}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-ethiopic text-2xl font-semibold leading-tight text-burgundy-ink dark:text-cream">
            {song.title}
          </h1>
          {song.title_en && (
            <p className="mt-0.5 font-display text-[15px] italic text-muted-foreground">
              {song.title_en}
            </p>
          )}
        </div>
      </div>

      {/* Category + actions row */}
      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-burgundy/[0.08] px-2.5 py-1 text-[11px] font-medium text-burgundy dark:bg-gold/[0.12] dark:text-gold-light">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          {song.category}
        </span>
        {song.audio_url && <AudioPill src={song.audio_url} />}
      </div>

      {/* Lyrics card */}
      <article className="relative mt-[18px] rounded-2xl border border-border bg-card px-[22px] py-5 pb-6">
        <header className="mb-3.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep dark:text-gold">
            Lyrics
          </span>
          <span className="font-ethiopic text-sm text-gold opacity-60">✣</span>
        </header>

        <div className="font-ethiopic text-base font-medium leading-[1.85] text-foreground">
          {verses.map((verse, i) => (
            <div key={i}>
              {i > 0 && (
                <div className="my-5 flex items-center justify-center gap-2">
                  <span className="h-px w-8 bg-border" />
                  <span className="flex items-center gap-1">
                    <span className="h-[3px] w-[3px] rounded-full bg-gold opacity-40" />
                    <span className="h-[3px] w-[3px] rounded-full bg-gold" />
                    <span className="h-[3px] w-[3px] rounded-full bg-gold opacity-40" />
                  </span>
                  <span className="h-px w-8 bg-border" />
                </div>
              )}
              <p className="whitespace-pre-line">
                {i === 0 && verse.length > 0 ? (
                  <>
                    <span className="float-left mr-2 mt-1 font-display text-[52px] font-medium leading-[0.85] text-burgundy dark:text-gold">
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
        </div>
      </article>
    </div>
  );
}
