/**
 * File storage: Cloudflare R2 in staging and production, local disk in
 * development (lib/storage-config.ts, STORAGE_DRIVER).
 *
 * Two stores:
 * - uploads: private files. Keys look like "receipts/<user id>/<file name>".
 *   Never served directly: app/api/receipts checks permissions and streams
 *   the file through the server.
 * - media: song audio ("audio/<uuid>.<ext>") and notice images
 *   ("notices/<uuid>.<ext>"). app/api/media checks permissions, then
 *   redirects to a short-lived signed R2 link (local: streams from disk).
 *
 * Local disk layout: uploads under UPLOAD_DIR, media under UPLOAD_DIR/media.
 * R2 talks the S3 API; requests are signed with aws4fetch (small, no
 * dependencies, works with fetch).
 */
import 'server-only';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { AwsClient } from 'aws4fetch';
import {
  imageFileType,
  mediaContentType,
  NOTICE_IMAGE_MAX_BYTES,
} from './media';
import { storageConfig, type Store } from './storage-config';

export type { Store } from './storage-config';

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.pdf': 'application/pdf',
};

export const ALLOWED_UPLOAD_TYPES = new Set(Object.values(CONTENT_TYPES));
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

/** Signed links for audio and images stay valid this long. */
const SIGNED_GET_SECONDS = 60 * 60;
/** Signed upload links (browser -> R2) stay valid this long. */
export const SIGNED_PUT_SECONDS = 5 * 60;

/* ─── Drivers ──────────────────────────────────────────────── */

let client: AwsClient | undefined;

function s3() {
  const config = storageConfig();
  if (config.driver !== 's3') throw new Error('Not using R2 storage');
  client ??= new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: 's3',
    region: 'auto',
  });
  return { config, client };
}

/** https://<account>.r2.cloudflarestorage.com/<bucket>/<key> */
function objectUrl(store: Store, key: string): URL {
  const { config } = s3();
  const encoded = key.split('/').map(encodeURIComponent).join('/');
  return new URL(`${config.endpoint}/${config.buckets[store]}/${encoded}`);
}

/** Resolves a key to an absolute path, refusing anything outside the store's folder. */
function localPath(store: Store, key: string): string {
  const config = storageConfig();
  if (config.driver !== 'local') throw new Error('Not using local storage');
  const root =
    store === 'media' ? path.join(config.root, 'media') : config.root;
  const full = path.resolve(root, key);
  if (!full.startsWith(root + path.sep)) throw new Error('Invalid file key');
  return full;
}

export const usesLocalStorage = () => storageConfig().driver === 'local';

/** Stores a file. Throws when the storage rejects it. */
export async function putObject(
  store: Store,
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<void> {
  if (usesLocalStorage()) {
    const full = localPath(store, key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, body);
    return;
  }
  // Sign first, then send the bytes ourselves with an exact Content-Length.
  // R2 refuses chunked uploads (411), and in the production build a body
  // passed through aws4fetch's Request reaches R2 as a chunked stream.
  const signed = await s3().client.sign(objectUrl(store, key), {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
  });
  const headers = new Headers(signed.headers);
  headers.set('Content-Length', String(body.byteLength));
  const res = await fetch(signed.url, {
    method: 'PUT',
    headers,
    body: body as BodyInit,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Storage upload failed (${res.status})`);
}

/** Size and type of a stored file, or null when it does not exist. */
export async function headObject(
  store: Store,
  key: string,
): Promise<{ size: number; contentType: string | null } | null> {
  if (usesLocalStorage()) {
    try {
      const info = await stat(localPath(store, key));
      return info.isFile()
        ? { size: info.size, contentType: mediaContentType(key) }
        : null;
    } catch {
      return null;
    }
  }
  const res = await s3().client.fetch(objectUrl(store, key), {
    method: 'HEAD',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Storage lookup failed (${res.status})`);
  return {
    size: Number(res.headers.get('content-length') ?? 0),
    contentType: res.headers.get('content-type'),
  };
}

/** Reads a whole stored file. Returns null when it does not exist. */
async function getObject(
  store: Store,
  key: string,
): Promise<Buffer | null> {
  if (usesLocalStorage()) {
    try {
      return await readFile(localPath(store, key));
    } catch {
      return null;
    }
  }
  const res = await s3().client.fetch(objectUrl(store, key));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Storage download failed (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

/** Deletes a stored file. Never throws (a leftover file is harmless). */
export async function deleteObject(store: Store, key: string): Promise<void> {
  try {
    if (usesLocalStorage()) {
      await rm(localPath(store, key), { force: true });
      return;
    }
    await s3().client.fetch(objectUrl(store, key), { method: 'DELETE' });
  } catch {
    // ignore
  }
}

/**
 * Signed link the browser uses to upload a file straight to R2 (PUT, valid
 * SIGNED_PUT_SECONDS). The Content-Type is part of the signature, so the
 * browser must send exactly `contentType`.
 */
export async function signedUploadUrl(
  store: Store,
  key: string,
  contentType: string,
): Promise<string> {
  const url = objectUrl(store, key);
  url.searchParams.set('X-Amz-Expires', String(SIGNED_PUT_SECONDS));
  const signed = await s3().client.sign(url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    aws: { signQuery: true, allHeaders: true },
  });
  return signed.url;
}

async function signedDownloadUrl(store: Store, key: string): Promise<string> {
  const url = objectUrl(store, key);
  url.searchParams.set('X-Amz-Expires', String(SIGNED_GET_SECONDS));
  const signed = await s3().client.sign(url, {
    method: 'GET',
    aws: { signQuery: true },
  });
  return signed.url;
}

/* ─── Media (song audio, notice images) ────────────────────── */

/**
 * Response for a media file, after the caller checked permissions.
 * R2: a redirect to a short-lived signed link, so audio streams (and seeks)
 * straight from R2. Local: the file from disk, with Range support.
 */
export async function mediaResponse(
  key: string,
  request: Request,
): Promise<Response> {
  if (!usesLocalStorage()) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: await signedDownloadUrl('media', key),
        // Lets the browser reuse the redirect while seeking; the link itself
        // expires after SIGNED_GET_SECONDS.
        'Cache-Control': 'private, max-age=300',
      },
    });
  }

  const full = localPath('media', key);
  let size: number;
  try {
    const info = await stat(full);
    if (!info.isFile()) throw new Error('not a file');
    size = info.size;
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const headers: Record<string, string> = {
    'Content-Type': mediaContentType(key),
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private',
    'X-Content-Type-Options': 'nosniff',
  };

  let start = 0;
  let end = size - 1;
  let status = 200;
  const range = request.headers.get('range');
  const match = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null;
  if (match && (match[1] || match[2])) {
    if (match[1]) {
      start = Number(match[1]);
      if (match[2]) end = Math.min(Number(match[2]), size - 1);
    } else {
      // "bytes=-500": the last 500 bytes.
      start = Math.max(size - Number(match[2]), 0);
    }
    if (start > end || start >= size) {
      return new Response(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${size}` },
      });
    }
    status = 206;
    headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
  }
  headers['Content-Length'] = String(end - start + 1);

  if (request.method === 'HEAD' || size === 0) {
    return new Response(null, { status, headers });
  }
  const stream = Readable.toWeb(
    createReadStream(full, { start, end }),
  ) as ReadableStream<Uint8Array>;
  return new Response(stream, { status, headers });
}

/**
 * Local driver only: writes an upload that the browser sent to
 * /api/media/upload (stands in for the signed R2 link in development).
 * Stops and removes the file when it grows past `maxBytes`.
 */
export async function writeLocalMedia(
  key: string,
  body: ReadableStream<Uint8Array>,
  maxBytes: number,
): Promise<'ok' | 'too_large'> {
  const full = localPath('media', key);
  await mkdir(path.dirname(full), { recursive: true });
  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return 'too_large';
    }
    chunks.push(value);
  }
  await writeFile(full, Buffer.concat(chunks));
  return 'ok';
}

/** Saves a notice image (JPG, PNG, WEBP, max 5 MB) and returns its media key. */
export async function saveNoticeImage(file: File): Promise<string> {
  const type = imageFileType(file.name, file.type);
  if (!type) throw new Error('Only JPG, PNG and WEBP images are allowed.');
  if (file.size > NOTICE_IMAGE_MAX_BYTES)
    throw new Error('Image is larger than 5 MB.');

  const key = `notices/${randomUUID()}.${type.ext}`;
  await putObject(
    'media',
    key,
    new Uint8Array(await file.arrayBuffer()),
    type.contentType,
  );
  return key;
}

/* ─── Private uploads ──────────────────────────────────────── */

/** Saves an uploaded file in the private store and returns its key. */
export async function saveUpload(folder: string, file: File): Promise<string> {
  const ext = path.extname(file.name).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType || !ALLOWED_UPLOAD_TYPES.has(file.type)) {
    throw new Error(
      'Only images (JPG, PNG, WEBP, HEIC) and PDF files are allowed.',
    );
  }
  if (file.size > MAX_UPLOAD_BYTES)
    throw new Error('File is larger than 5 MB.');

  const key = `${folder}/${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
  await putObject(
    'uploads',
    key,
    new Uint8Array(await file.arrayBuffer()),
    contentType,
  );
  return key;
}

/** Reads a stored private file. Returns null when it does not exist. */
export async function readUpload(
  key: string,
): Promise<{ body: Buffer; contentType: string } | null> {
  let body: Buffer | null;
  try {
    body = await getObject('uploads', key);
  } catch {
    return null;
  }
  if (!body) return null;
  const contentType =
    CONTENT_TYPES[path.extname(key).toLowerCase()] ??
    'application/octet-stream';
  return { body, contentType };
}

/* ─── Donation receipts ────────────────────────────────────── */

/**
 * Saves a donation receipt. Returns the key stored in donations.receipt_url:
 * "<user id>/<file name>" (same shape as the old Supabase bucket paths).
 * In the uploads store it lives at "receipts/<user id>/<file name>".
 */
export async function saveReceipt(userId: string, file: File): Promise<string> {
  const key = await saveUpload(`receipts/${userId}`, file);
  return key.slice('receipts/'.length);
}

/** URL that serves a receipt after a permission check. */
export const receiptUrl = (receiptKey: string) => `/api/receipts/${receiptKey}`;

/** Deletes a stored receipt (e.g. when saving the donation failed). Never throws. */
export async function deleteReceipt(receiptKey: string): Promise<void> {
  await deleteObject('uploads', `receipts/${receiptKey}`);
}
