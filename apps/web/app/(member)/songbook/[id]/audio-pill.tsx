'use client';

import { useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { useT } from '@/lib/i18n/client';

/** "Play recording" pill that plays the song's audio in place. */
export function AudioPill({ src }: { src: string }) {
  const t = useT();
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const audio = ref.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        className="inline-flex items-center gap-1.5 rounded-full border border-gold/35 bg-brand px-3 py-1.5 text-[11px] font-semibold text-cream shadow-[0_4px_12px_-4px_rgba(10,60,54,0.4)] transition-opacity hover:opacity-95"
      >
        {playing ? (
          <Pause className="h-[11px] w-[11px] text-gold" />
        ) : (
          <Play className="h-[11px] w-[11px] text-gold" />
        )}
        {playing ? t('Pause') : t('Play recording')}
      </button>
      <audio
        ref={ref}
        src={src}
        onEnded={() => setPlaying(false)}
        preload="none"
        className="hidden"
      />
    </>
  );
}
