'use client';

import { useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { useT } from '@/lib/i18n/client';
import { cn } from '@/lib/utils';

const clock = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

/**
 * "Play recording" pill that plays a song's audio in place. Once playback
 * starts, a seek bar with the elapsed and total time appears next to it.
 * `src` is an uploaded file (/api/media/…) or an external link.
 */
export function AudioPlayer({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  const t = useT();
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  function toggle() {
    const audio = ref.current;
    if (!audio) return;
    if (audio.paused) {
      setStarted(true);
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }

  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gold/35 bg-brand px-3 py-1.5 text-[11px] font-semibold text-cream shadow-[0_4px_12px_-4px_rgba(10,60,54,0.4)] transition-opacity hover:opacity-95"
      >
        {playing ? (
          <Pause className="h-[11px] w-[11px] text-gold" />
        ) : (
          <Play className="h-[11px] w-[11px] text-gold" />
        )}
        {playing ? t('Pause') : t('Play recording')}
      </button>
      {started && (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step="any"
            value={Math.min(time, duration || 0)}
            onChange={(e) => {
              const audio = ref.current;
              if (audio) audio.currentTime = Number(e.target.value);
              setTime(Number(e.target.value));
            }}
            disabled={!duration}
            aria-label={t('Seek')}
            className="h-1 min-w-[80px] flex-1 cursor-pointer accent-gold"
          />
          <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-ink-muted">
            {clock(time)} / {clock(duration)}
          </span>
        </div>
      )}
      <audio
        ref={ref}
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        className="hidden"
      />
    </div>
  );
}
