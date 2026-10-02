/**
 * Loads environment variables from the repo root (.env.local, then .env)
 * so db scripts work without extra tooling. Existing variables win.
 *
 * Finds the root by walking up from the current directory to
 * pnpm-workspace.yaml (import.meta is not available when drizzle-kit
 * bundles its config file).
 */
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

function findRepoRoot(start: string): string | undefined {
  let dir = start;
  while (!existsSync(resolve(dir, 'pnpm-workspace.yaml'))) {
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
  return dir;
}

const root = findRepoRoot(process.cwd());
if (root) {
  for (const file of ['.env.local', '.env']) {
    const path = resolve(root, file);
    if (existsSync(path)) process.loadEnvFile(path);
  }
}
