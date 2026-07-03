'use client';

import { useRef, useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import { MemberQR } from '@/components/member-qr';
import { useToast } from '@/hooks/use-toast';

export function MemberQRCard({ memberId }: { memberId: string }) {
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);
  const { toast } = useToast();

  function getCanvas(): HTMLCanvasElement | null {
    return canvasWrapperRef.current?.querySelector('canvas') ?? null;
  }

  async function handleDownload() {
    setBusy('save');
    try {
      const canvas = getCanvas();
      if (!canvas) throw new Error('QR not ready');
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `felege-yordanos-${memberId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Try again',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    setBusy('share');
    try {
      const canvas = getCanvas();
      if (!canvas) throw new Error('QR not ready');

      // Try the file-share path first (Web Share Level 2)
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      const file = blob
        ? new File([blob], `felege-yordanos-${memberId}.png`, { type: 'image/png' })
        : null;

      const navAny = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };

      if (file && navAny.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'My check-in code',
          text: memberId,
          files: [file],
        });
        return;
      }

      if (navigator.share) {
        await navigator.share({ title: 'My check-in code', text: memberId });
        return;
      }

      // Fallback: clipboard copy
      await navigator.clipboard.writeText(memberId);
      toast({ title: 'Copied to clipboard', description: memberId });
    } catch (err) {
      // AbortError when user cancels share — silent
      if (err instanceof DOMException && err.name === 'AbortError') return;
      toast({
        title: 'Share failed',
        description: err instanceof Error ? err.message : 'Try again',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      className="sacred-gradient relative overflow-hidden rounded-2xl border border-gold/30 px-[18px] pb-4 pt-[18px] text-cream shadow-fy-lg"
      aria-label="Member check-in QR code"
    >
      <div className="tibeb-gold absolute inset-0 opacity-[0.35]" />
      <div className="relative">
        <div className="mb-3 flex items-baseline justify-between">
          <div className="font-ethiopic text-[11px] tracking-[0.06em] text-gold-light">
            የመግቢያ ኮድ
          </div>
          <span className="font-mono text-[11px] font-semibold tracking-[0.05em] text-gold">
            {memberId}
          </span>
        </div>

        {/* QR + frame */}
        <div className="mb-3.5 flex justify-center">
          <div
            ref={canvasWrapperRef}
            className="rounded-xl border border-gold/40 bg-parchment-soft p-3 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.4)]"
          >
            <MemberQR value={memberId} size={196} />
          </div>
        </div>

        <p className="text-center font-ethiopic text-xs leading-snug text-gold-light">
          ይህን ኮድ ለመግቢያ ያሳዩ
        </p>
        <p className="mt-0.5 text-center font-display text-[11px] italic text-cream/55">
          Show this code at the door to check in
        </p>

        <div className="mt-3.5 flex gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={busy !== null}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-gold/35 bg-cream/[0.10] px-3 py-2.5 text-xs font-semibold text-cream transition-colors hover:bg-cream/[0.15] disabled:opacity-60"
          >
            <Download className="h-3.5 w-3.5 text-gold" />
            {busy === 'save' ? 'Saving…' : 'Save image'}
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={busy !== null}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-gold/35 bg-gold/[0.15] px-3 py-2.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/[0.22] disabled:opacity-60"
          >
            <Share2 className="h-3.5 w-3.5 text-gold" />
            {busy === 'share' ? 'Sharing…' : 'Share'}
          </button>
        </div>
      </div>
    </section>
  );
}
