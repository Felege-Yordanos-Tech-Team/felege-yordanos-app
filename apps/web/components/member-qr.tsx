'use client';

import { QRCodeCanvas } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface MemberQRProps {
  /** The member_id encoded in the QR (used at the door for check-in). */
  value: string;
  /** Pixel size of the QR square. The center brand mark scales with it. */
  size?: number;
  className?: string;
}

/**
 * The check-in QR with the Sunday School brand mark in its center cutout.
 * Shared by the full profile card and the compact dashboard check-in card so
 * the encoding, colors and error-correction stay identical in one place.
 */
export function MemberQR({ value, size = 196, className }: MemberQRProps) {
  const markBox = Math.round(size * 0.185);
  const brand = Math.round(size * 0.145);

  return (
    <div className={cn('relative inline-flex', className)}>
      <QRCodeCanvas
        value={value}
        size={size}
        level="H"
        bgColor="#FBF6E4"
        fgColor="#2C0810"
        marginSize={0}
      />
      <div
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-parchment-soft p-[3px] shadow-[0_0_0_3px_#FBF6E4]"
        style={{ height: markBox, width: markBox }}
        aria-hidden
      >
        <svg viewBox="0 0 80 80" width={brand} height={brand}>
          <circle
            cx="40"
            cy="40"
            r="39"
            fill="#6B1D2A"
            stroke="#D4A843"
            strokeOpacity="0.7"
            strokeWidth="0.8"
          />
          <g fill="#D4A843">
            <rect x="37.5" y="14" width="5" height="52" rx="0.5" />
            <rect x="14" y="37.5" width="52" height="5" rx="0.5" />
            <rect x="34" y="11" width="12" height="3.5" rx="0.5" />
            <rect x="34" y="65.5" width="12" height="3.5" rx="0.5" />
            <rect x="11" y="34" width="3.5" height="12" rx="0.5" />
            <rect x="65.5" y="34" width="3.5" height="12" rx="0.5" />
            <circle cx="40" cy="40" r="7" fill="#6B1D2A" />
            <circle cx="40" cy="40" r="5.5" fill="none" stroke="#D4A843" strokeWidth="1" />
            <circle cx="40" cy="40" r="2" fill="#D4A843" />
          </g>
        </svg>
      </div>
    </div>
  );
}
