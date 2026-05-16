'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Info, ScanLine, X } from 'lucide-react';

export type ScanResult =
  | { kind: 'success'; name: string; memberId: string; time: string }
  | { kind: 'already'; name: string; memberId: string }
  | { kind: 'invalid'; code: string };

interface QRScannerProps {
  active: boolean; // true when the QR tab is selected
  onMemberId: (memberId: string) => Promise<ScanResult>; // parent decides validation
  presentCount: number;
  total: number;
}

const VIDEO_ELEMENT_ID = 'fy-qr-reader';

export function QRScanner({ active, onMemberId, presentCount, total }: QRScannerProps) {
  const scannerRef = useRef<unknown | null>(null);
  const lastValueRef = useRef<string>('');
  const lastAtRef = useRef<number>(0);
  const [status, setStatus] = useState<'idle' | 'starting' | 'running' | 'denied' | 'error'>(
    'idle',
  );
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);

  useEffect(() => {
    if (!active) {
      // Stop scanner on tab switch / unmount
      stopScanner();
      return;
    }

    let cancelled = false;
    setStatus('starting');
    setErrorMessage('');

    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;

        const instance = new Html5Qrcode(VIDEO_ELEMENT_ID, /* verbose */ false);
        scannerRef.current = instance;

        await instance.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
          },
          (decoded) => {
            handleDecode(decoded);
          },
          () => {
            // Per-frame "no QR detected" — noisy, ignore
          },
        );

        if (cancelled) {
          instance.stop().catch(() => undefined);
          return;
        }

        setStatus('running');
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        const lower = msg.toLowerCase();
        if (lower.includes('permission') || lower.includes('notallowed') || lower.includes('denied')) {
          setStatus('denied');
        } else {
          setStatus('error');
          setErrorMessage(msg);
        }
      }
    })();

    return () => {
      cancelled = true;
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function stopScanner() {
    const inst = scannerRef.current as { stop?: () => Promise<void>; clear?: () => void } | null;
    if (!inst) return;
    inst.stop?.()
      .then(() => inst.clear?.())
      .catch(() => undefined)
      .finally(() => {
        scannerRef.current = null;
      });
  }

  async function handleDecode(decoded: string) {
    const now = Date.now();
    // Debounce: ignore same code within 2s, or any code within 600ms
    if (now - lastAtRef.current < 600) return;
    if (decoded === lastValueRef.current && now - lastAtRef.current < 2000) return;
    lastValueRef.current = decoded;
    lastAtRef.current = now;

    const result = await onMemberId(decoded);
    setLastScan(result);
  }

  async function retry() {
    setStatus('idle');
    // Toggling status via active won't refresh — force re-run by remounting via a hard refresh
    // Simpler: directly try to (re)start. Since the effect re-runs on `active`, flip it.
    // The easy path: call start manually here.
    setStatus('starting');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const instance = new Html5Qrcode(VIDEO_ELEMENT_ID, false);
      scannerRef.current = instance;
      await instance.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
        (decoded) => handleDecode(decoded),
        () => undefined,
      );
      setStatus('running');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const lower = msg.toLowerCase();
      if (lower.includes('permission') || lower.includes('notallowed') || lower.includes('denied')) {
        setStatus('denied');
      } else {
        setStatus('error');
        setErrorMessage(msg);
      }
    }
  }

  return (
    <div>
      {/* Camera viewfinder */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-[#0A0604] to-[#16100A]">
        {/* Camera mount point — html5-qrcode injects a video element here */}
        <div id={VIDEO_ELEMENT_ID} className="absolute inset-0 h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />

        {/* Dark vignette */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(0,0,0,0.7) 100%)',
          }}
        />

        {/* Loading / permission / error overlays */}
        {(status === 'idle' || status === 'starting') && (
          <ScannerStateMessage
            icon={<Camera className="h-6 w-6 text-gold" />}
            title="Starting camera…"
            subtitle="Allow camera access if prompted"
          />
        )}
        {status === 'denied' && (
          <ScannerStateMessage
            icon={<Camera className="h-6 w-6 text-status-absent" />}
            title="Camera permission required"
            subtitle="Allow camera in your browser, then retry."
            action={
              <button
                type="button"
                onClick={retry}
                className="rounded-lg border border-gold/40 bg-gold/20 px-3 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/30"
              >
                Retry
              </button>
            }
          />
        )}
        {status === 'error' && (
          <ScannerStateMessage
            icon={<X className="h-6 w-6 text-status-absent" />}
            title="Scanner unavailable"
            subtitle={errorMessage || 'Your browser may not support camera access.'}
            action={
              <button
                type="button"
                onClick={retry}
                className="rounded-lg border border-gold/40 bg-gold/20 px-3 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/30"
              >
                Retry
              </button>
            }
          />
        )}

        {/* Corner-bracket frame + scanning line (only when running) */}
        {status === 'running' && (
          <>
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2">
              <Corner pos="tl" />
              <Corner pos="tr" />
              <Corner pos="bl" />
              <Corner pos="br" />
              <div
                aria-hidden
                className="absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 animate-pulse"
                style={{
                  background:
                    'linear-gradient(to right, transparent, #D4A843 50%, transparent)',
                  boxShadow:
                    '0 0 16px rgba(212,168,67,0.7), 0 0 32px rgba(212,168,67,0.4)',
                }}
              />
            </div>

            {/* Live counter overlay top-right */}
            <div
              className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-burgundy/80 px-2.5 py-1 text-cream backdrop-blur-sm"
              style={{ background: 'linear-gradient(135deg, rgba(107,29,42,0.85), rgba(74,14,24,0.85))' }}
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-status-present"
                style={{ boxShadow: '0 0 6px #4F7B3E' }}
              />
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gold-light/80">
                Live
              </span>
              <span className="font-mono text-[12px] font-bold text-gold">
                {presentCount}
              </span>
              <span className="font-mono text-[10px] text-gold-light/60">/ {total}</span>
            </div>

            {/* Instruction text below frame */}
            <div className="pointer-events-none absolute bottom-4 left-1/2 w-[80%] -translate-x-1/2 text-center">
              <div className="font-ethiopic text-[13px] tracking-[0.04em] text-gold-light">
                ኮድ በመስኩ ውስጥ ያስቀምጡ
              </div>
              <div className="mt-0.5 font-display text-xs italic text-cream/60">
                Position QR code inside the frame
              </div>
            </div>
          </>
        )}
      </div>

      {/* Feedback banner */}
      {lastScan ? (
        <ScanFeedbackBanner result={lastScan} />
      ) : status === 'running' ? (
        <p className="mt-3 text-center text-[10px] italic text-muted-foreground">
          Scan a QR · ready for the next member
        </p>
      ) : null}
    </div>
  );
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const base =
    'absolute h-7 w-7 ' +
    (pos === 'tl'
      ? 'left-0 top-0 rounded-tl-xl border-l-[3px] border-t-[3px]'
      : pos === 'tr'
        ? 'right-0 top-0 rounded-tr-xl border-r-[3px] border-t-[3px]'
        : pos === 'bl'
          ? 'bottom-0 left-0 rounded-bl-xl border-b-[3px] border-l-[3px]'
          : 'bottom-0 right-0 rounded-br-xl border-b-[3px] border-r-[3px]');
  return (
    <span
      aria-hidden
      className={base + ' border-gold'}
      style={{ filter: 'drop-shadow(0 0 4px rgba(212,168,67,0.4))' }}
    />
  );
}

function ScannerStateMessage({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-[#0A0604] to-[#16100A] px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-cream/[0.08]">
        {icon}
      </div>
      <div className="font-display text-base font-medium text-cream">{title}</div>
      <div className="text-[11px] text-cream/60">{subtitle}</div>
      {action}
    </div>
  );
}

function ScanFeedbackBanner({ result }: { result: ScanResult }) {
  if (result.kind === 'success') {
    return (
      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-status-present/30 bg-gradient-to-br from-status-present-bg to-status-present-bg/60 px-4 py-3 dark:from-status-present/[0.30] dark:to-status-present/[0.12] dark:border-status-present/40">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-present">
          <Check className="h-[22px] w-[22px] text-cream" strokeWidth={3} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-base font-medium leading-tight text-burgundy-ink dark:text-foreground">
            {result.name}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-status-present">
            <ScanLine className="h-2.5 w-2.5" />
            Checked in · {result.memberId}
          </div>
        </div>
        <div className="shrink-0 font-mono text-[10px] font-semibold text-status-present">
          {result.time}
        </div>
      </div>
    );
  }
  if (result.kind === 'already') {
    return (
      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-status-late/40 bg-gradient-to-br from-status-late-bg to-status-late-bg/60 px-4 py-3 dark:from-status-late/[0.25] dark:to-status-late/[0.10]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-late">
          <Info className="h-5 w-5 text-cream" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-base font-medium leading-tight text-burgundy-ink dark:text-foreground">
            {result.name}
          </div>
          <div className="mt-0.5 text-[11px] font-semibold text-status-late">
            Already marked present · {result.memberId}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-status-absent/40 bg-gradient-to-br from-status-absent-bg to-status-absent-bg/60 px-4 py-3 dark:from-status-absent/[0.30] dark:to-status-absent/[0.12]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-absent">
        <X className="h-[22px] w-[22px] text-cream" strokeWidth={3} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-medium leading-tight text-burgundy-ink dark:text-foreground">
          Invalid QR code
        </div>
        <div className="mt-0.5 truncate text-[11px] font-medium text-status-absent">
          Not a Felege Yordanos member ID
        </div>
      </div>
    </div>
  );
}
