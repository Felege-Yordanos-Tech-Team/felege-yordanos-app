/**
 * Storage settings from the environment. No 'server-only' import, so
 * instrumentation.ts can check them when the server starts.
 *
 *   STORAGE_DRIVER=local (default)  files on disk under UPLOAD_DIR
 *   STORAGE_DRIVER=s3               Cloudflare R2 (S3 API): R2_ENDPOINT,
 *                                   R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *                                   R2_UPLOADS_BUCKET, R2_MEDIA_BUCKET
 */
import path from 'node:path';

/**
 * uploads: private files (donation receipts), only ever streamed through a
 * permission-checked route. media: song audio and notice images, read
 * through short-lived signed links. Never put personal files in media.
 */
export type Store = 'uploads' | 'media';

export type StorageConfig =
  | { driver: 'local'; root: string }
  | {
      driver: 's3';
      endpoint: string;
      accessKeyId: string;
      secretAccessKey: string;
      buckets: Record<Store, string>;
    };

let cached: StorageConfig | undefined;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `${name} is not set. It is required when STORAGE_DRIVER=s3 (see .env.example).`,
    );
  }
  return value;
}

/** Reads and checks the storage settings. Throws a clear error when one is missing. */
export function storageConfig(): StorageConfig {
  if (cached) return cached;
  const driver = process.env['STORAGE_DRIVER']?.trim() || 'local';

  if (driver === 'local') {
    cached = {
      driver,
      root: path.resolve(
        process.env['UPLOAD_DIR'] ??
          path.join(process.cwd(), '.data', 'uploads'),
      ),
    };
  } else if (driver === 's3') {
    const endpoint = required('R2_ENDPOINT').replace(/\/+$/, '');
    if (!/^https?:\/\/[^/]+$/.test(endpoint)) {
      throw new Error(
        'R2_ENDPOINT must be the account endpoint, e.g. https://<account id>.r2.cloudflarestorage.com (no bucket or path).',
      );
    }
    cached = {
      driver,
      endpoint,
      accessKeyId: required('R2_ACCESS_KEY_ID'),
      secretAccessKey: required('R2_SECRET_ACCESS_KEY'),
      buckets: {
        uploads: required('R2_UPLOADS_BUCKET'),
        media: required('R2_MEDIA_BUCKET'),
      },
    };
  } else {
    throw new Error(
      `STORAGE_DRIVER must be "local" or "s3" (got "${driver}").`,
    );
  }
  return cached;
}
