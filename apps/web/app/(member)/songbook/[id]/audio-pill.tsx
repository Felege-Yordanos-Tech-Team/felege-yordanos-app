'use client';

import { useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

export function AudioPill({ src }: { src: string }) {
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
        className="inline-flex items-center gap-1.5 rounded-full border border-gold/35 bg-burgundy px-3 py-1.5 text-[11px] font-semibold text-cream shadow-fy-md transition-opacity hover:opacity-95"
      >
        {playing ? (
          <Pause className="h-2.5 w-2.5 text-gold" />
        ) : (
          <Play className="h-2.5 w-2.5 text-gold" />
        )}
        {playing ? 'Pause' : 'Play recording'}
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
