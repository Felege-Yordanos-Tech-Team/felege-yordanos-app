/**
 * Loads environment variables from the repo root (.env.local, then .env)
 * so db scripts work without extra tooling. Existing variables win.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../..');
for (const file of ['.env.local', '.env']) {
  const path = resolve(root, file);
  if (existsSync(path)) process.loadEnvFile(path);
}
