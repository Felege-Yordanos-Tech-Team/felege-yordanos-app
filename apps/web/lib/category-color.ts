/**
 * Category dot colors.
 *
 * Categories store a color as either a hex value or a plain color name
 * ("blue", "amber", ...). Names are mapped to muted tones that sit well on
 * parchment; hex values are used as stored; anything else falls back to the
 * design palette by position.
 */
const DESIGN_DOTS = [
  '#D4A843',
  '#1C6B60',
  '#2E8577',
  '#4F7B3E',
  '#C97B1A',
  '#A47A18',
];

const NAMED: Record<string, string> = {
  gold: '#D4A843',
  yellow: '#D4A843',
  amber: '#D4A843',
  orange: '#C97B1A',
  teal: '#1C6B60',
  cyan: '#2E8577',
  emerald: '#2E8577',
  green: '#4F7B3E',
  lime: '#4F7B3E',
  blue: '#3F6E8C',
  sky: '#3F6E8C',
  indigo: '#4C5C8F',
  purple: '#7A5280',
  violet: '#7A5280',
  fuchsia: '#8E4A79',
  pink: '#A65A6E',
  rose: '#A65A6E',
  red: '#A12831',
  brown: '#8A6A3C',
  stone: '#8A7758',
  gray: '#8A7758',
  grey: '#8A7758',
  slate: '#5E6B70',
};

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function categoryDot(
  color: string | null | undefined,
  index: number,
): string {
  const c = (color ?? '').trim().toLowerCase();
  if (HEX.test(c)) return c;
  // Tailwind-style names like "blue-500" or "amber" map by their hue name.
  const hue = c.split('-')[0];
  if (hue && NAMED[hue]) return NAMED[hue];
  return DESIGN_DOTS[
    ((index % DESIGN_DOTS.length) + DESIGN_DOTS.length) % DESIGN_DOTS.length
  ];
}

/** Map of category name -> dot color, in the categories' sort order. */
export function categoryDotMap(
  categories: { name: string; color: string | null }[],
): Map<string, string> {
  const map = new Map<string, string>();
  categories.forEach((c, i) => map.set(c.name, categoryDot(c.color, i)));
  return map;
}

/** True when the text has Ethiopic letters (category names are stored as typed). */
export function hasEthiopic(s: string | null | undefined): boolean {
  return /[ሀ-፿]/.test(s ?? '');
}

/**
 * Songbook search: title (Amharic or English), exact number, or a phrase from
 * the lyrics, as the search placeholder promises.
 */
export function matchesSongSearch(
  song: {
    title: string;
    titleEn: string | null;
    number: number | null;
    lyrics: string | null;
  },
  search: string,
): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return (
    song.title.toLowerCase().includes(q) ||
    !!song.titleEn?.toLowerCase().includes(q) ||
    song.number?.toString() === q ||
    !!song.lyrics?.toLowerCase().includes(q)
  );
}

/** Song numbers are shown zero-padded (01, 07, 12). */
export function songNumber(n: number | null | undefined): string {
  return n != null ? String(n).padStart(2, '0') : '';
}
