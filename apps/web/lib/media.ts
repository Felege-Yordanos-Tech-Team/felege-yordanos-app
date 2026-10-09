/**
 * Media files (song audio, notice images): allowed types, size limits, key
 * shapes and URLs. Safe to import anywhere (no server code).
 *
 * Keys in the media store look like "audio/<uuid>.mp3" or
 * "notices/<uuid>.jpg". The browser always loads them through
 * /api/media/<key>, which checks permissions first.
 */

export const AUDIO_MAX_BYTES = 30 * 1024 * 1024; // 30 MB
export const NOTICE_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/** Audio extension -> the content type it is stored and served with. */
export const AUDIO_TYPES: Record<string, string> = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
};

/** Types browsers report for those files (they differ per browser and OS). */
const AUDIO_BROWSER_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/aac',
  'audio/x-aac',
  'audio/aacp',
  'audio/ogg',
  'application/ogg',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/vnd.wave',
]);

export const IMAGE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/** For <input accept>. */
export const AUDIO_ACCEPT = '.mp3,.m4a,.aac,.ogg,.wav,audio/*';
export const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

const extOf = (fileName: string) => {
  const dot = fileName.lastIndexOf('.');
  return dot === -1 ? '' : fileName.slice(dot + 1).toLowerCase();
};

/**
 * Stored extension and content type for an audio file, or null when it is not
 * an allowed audio file. The extension decides; the browser's type must not
 * contradict it.
 */
export function audioFileType(
  fileName: string,
  browserType: string,
): { ext: string; contentType: string } | null {
  const ext = extOf(fileName);
  const contentType = AUDIO_TYPES[ext];
  if (!contentType) return null;
  if (browserType && !AUDIO_BROWSER_TYPES.has(browserType.toLowerCase()))
    return null;
  return { ext, contentType };
}

/** Same for notice images (JPG, PNG, WEBP). */
export function imageFileType(
  fileName: string,
  browserType: string,
): { ext: string; contentType: string } | null {
  const ext = extOf(fileName);
  const contentType = IMAGE_TYPES[ext];
  if (!contentType || browserType.toLowerCase() !== contentType) return null;
  return { ext: ext === 'jpeg' ? 'jpg' : ext, contentType };
}

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const AUDIO_KEY = new RegExp(`^audio/${UUID}\\.(mp3|m4a|aac|ogg|wav)$`);
const NOTICE_IMAGE_KEY = new RegExp(`^notices/${UUID}\\.(jpg|png|webp)$`);

export const isAudioKey = (key: string) => AUDIO_KEY.test(key);
export const isNoticeImageKey = (key: string) => NOTICE_IMAGE_KEY.test(key);

/** Content type of a media key, from its extension. */
export function mediaContentType(key: string): string {
  const ext = extOf(key);
  return AUDIO_TYPES[ext] ?? IMAGE_TYPES[ext] ?? 'application/octet-stream';
}

/** URL that serves a media file after a permission check. */
export const mediaUrl = (key: string) => `/api/media/${key}`;

/** What a player should load: the uploaded file wins over an external link. */
export const songAudioSrc = (song: {
  audioKey: string | null;
  audioUrl: string | null;
}) => (song.audioKey ? mediaUrl(song.audioKey) : song.audioUrl);
