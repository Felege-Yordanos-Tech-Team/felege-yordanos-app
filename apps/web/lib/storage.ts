/**
 * File storage on the server's disk (replaces Supabase Storage).
 *
 * Files live under UPLOAD_DIR (default: <app dir>/.data/uploads). In
 * production this directory is a mounted volume included in backups.
 * Keys look like "receipts/<user id>/<file name>". Files are never served
 * directly: a route handler checks permissions first (app/api/receipts).
 */
import 'server-only';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(
  process.env['UPLOAD_DIR'] ?? path.join(process.cwd(), '.data', 'uploads'),
);

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

/** Resolves a key to an absolute path, refusing anything outside ROOT. */
function resolveKey(key: string): string {
  const full = path.resolve(ROOT, key);
  if (!full.startsWith(ROOT + path.sep)) throw new Error('Invalid file key');
  return full;
}

/** Saves an uploaded file and returns its key. */
export async function saveUpload(folder: string, file: File): Promise<string> {
  const ext = path.extname(file.name).toLowerCase();
  if (!CONTENT_TYPES[ext] || !ALLOWED_UPLOAD_TYPES.has(file.type)) {
    throw new Error(
      'Only images (JPG, PNG, WEBP, HEIC) and PDF files are allowed.',
    );
  }
  if (file.size > MAX_UPLOAD_BYTES)
    throw new Error('File is larger than 5 MB.');

  const key = `${folder}/${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
  const full = resolveKey(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, Buffer.from(await file.arrayBuffer()));
  return key;
}

/** Reads a stored file. Returns null when it does not exist. */
export async function readUpload(
  key: string,
): Promise<{ body: Buffer; contentType: string } | null> {
  try {
    const body = await readFile(resolveKey(key));
    const contentType =
      CONTENT_TYPES[path.extname(key).toLowerCase()] ??
      'application/octet-stream';
    return { body, contentType };
  } catch {
    return null;
  }
}

/* ─── Donation receipts ────────────────────────────────────── */

/**
 * Saves a donation receipt. Returns the key stored in donations.receipt_url:
 * "<user id>/<file name>" (same shape as the old Supabase bucket paths).
 */
export async function saveReceipt(userId: string, file: File): Promise<string> {
  const key = await saveUpload(`receipts/${userId}`, file);
  return key.slice('receipts/'.length);
}

/** URL that serves a receipt after a permission check. */
export const receiptUrl = (receiptKey: string) => `/api/receipts/${receiptKey}`;

/** Deletes a stored receipt (e.g. when saving the donation failed). Never throws. */
export async function deleteReceipt(receiptKey: string): Promise<void> {
  await rm(resolveKey(`receipts/${receiptKey}`), { force: true }).catch(
    () => undefined,
  );
}
