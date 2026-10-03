/**
 * Compact stepped-cross monogram (design system "FYLogoCross").
 * Use under ~64px; the painted medallion (/ss-logo.png) is for larger sizes.
 */
export function LogoCross({
  size = 34,
  bg = '#1C6B60',
  fg = '#D4A843',
  className,
}: {
  size?: number;
  bg?: string;
  fg?: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} aria-hidden>
      <circle cx="40" cy="40" r="39" fill={bg} stroke={fg} strokeOpacity="0.7" strokeWidth="0.8" />
      <circle cx="40" cy="40" r="35" fill="none" stroke={fg} strokeOpacity="0.3" strokeWidth="0.5" strokeDasharray="1 2" />
      <g fill={fg}>
        <rect x="37.5" y="14" width="5" height="52" rx="0.5" />
        <rect x="14" y="37.5" width="52" height="5" rx="0.5" />
        <rect x="34" y="11" width="12" height="3.5" rx="0.5" />
        <rect x="34" y="65.5" width="12" height="3.5" rx="0.5" />
        <rect x="11" y="34" width="3.5" height="12" rx="0.5" />
        <rect x="65.5" y="34" width="3.5" height="12" rx="0.5" />
        <circle cx="40" cy="40" r="7" fill={bg} />
        <circle cx="40" cy="40" r="5.5" fill="none" stroke={fg} strokeWidth="1" />
        <circle cx="40" cy="40" r="2" fill={fg} />
      </g>
    </svg>
  );
}
