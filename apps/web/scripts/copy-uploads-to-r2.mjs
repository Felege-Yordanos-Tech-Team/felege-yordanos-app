/**
 * Copies donation receipts from the uploads volume (UPLOAD_DIR/receipts) to
 * the R2 uploads bucket, with the same key ("receipts/<user id>/<file>").
 *
 * Safe to run again: files that are already in the bucket with the same size
 * are skipped. Prints counts only (never file names: they contain user ids).
 * Exits with code 1 when any file failed.
 *
 * In the image (bundled by assemble-image.sh), from the running app container:
 *   kamal app exec -d staging --reuse "node scripts/copy-uploads-to-r2.mjs"
 * Needs UPLOAD_DIR, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and
 * R2_UPLOADS_BUCKET (all set in the app container).
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { AwsClient } from 'aws4fetch';

const CONTENT_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.pdf': 'application/pdf',
};

function env(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`${name} is not set.`);
    process.exit(1);
  }
  return value;
}

const uploadDir = path.resolve(env('UPLOAD_DIR'));
const endpoint = env('R2_ENDPOINT').replace(/\/+$/, '');
if (!/^https?:\/\/[a-z0-9.-]+(:\d+)?$/i.test(endpoint)) {
  console.error('R2_ENDPOINT must look like https://<account id>.r2.cloudflarestorage.com');
  process.exit(1);
}
const bucket = env('R2_UPLOADS_BUCKET');
const client = new AwsClient({
  accessKeyId: env('R2_ACCESS_KEY_ID'),
  secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
  service: 's3',
  region: 'auto',
});

/** All files under dir, as paths relative to uploadDir. */
async function listFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(full)));
    else if (entry.isFile()) files.push(path.relative(uploadDir, full));
  }
  return files;
}

const objectUrl = (key) =>
  `${endpoint}/${bucket}/${key.split(path.sep).map(encodeURIComponent).join('/')}`;

/** 'copied' | 'skipped'; throws on failure. */
async function copy(key) {
  const body = await readFile(path.join(uploadDir, key));
  const head = await client.fetch(objectUrl(key), { method: 'HEAD' });
  if (head.ok && Number(head.headers.get('content-length')) === body.length)
    return 'skipped';
  if (!head.ok && head.status !== 404)
    throw new Error(`lookup failed (${head.status})`);

  const res = await client.fetch(objectUrl(key), {
    method: 'PUT',
    body,
    headers: {
      'Content-Type':
        CONTENT_TYPES[path.extname(key).toLowerCase()] ??
        'application/octet-stream',
    },
  });
  if (!res.ok) throw new Error(`upload failed (${res.status})`);
  return 'copied';
}

const files = await listFiles(path.join(uploadDir, 'receipts'));
const counts = { found: files.length, copied: 0, skipped: 0, failed: 0 };
const errors = new Map();

// A few at a time: fast enough, gentle on the server.
const queue = [...files];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    for (let key = queue.shift(); key; key = queue.shift()) {
      try {
        counts[await copy(key)]++;
      } catch (err) {
        counts.failed++;
        const reason = err instanceof Error ? err.message : 'unknown error';
        errors.set(reason, (errors.get(reason) ?? 0) + 1);
      }
    }
  }),
);

console.log(
  `Receipts: ${counts.found} found, ${counts.copied} copied, ${counts.skipped} already in R2, ${counts.failed} failed.`,
);
for (const [reason, n] of errors) console.log(`  ${n} x ${reason}`);
process.exit(counts.failed > 0 ? 1 : 0);
