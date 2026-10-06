/**
 * Bundles migrate.mjs (with drizzle-orm and postgres) into one file, so the
 * Docker image can run migrations without node_modules or drizzle-kit.
 * Used by apps/web/Dockerfile:
 *
 *   node libs/db/scripts/bundle-migrate.mjs /out/db/scripts/migrate.mjs
 *
 * esbuild is not a direct dependency: it is taken from tsx (already a dev
 * dependency) so the lockfile does not change.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const outfile = process.argv[2];
if (!outfile) {
  console.error('Usage: node bundle-migrate.mjs <outfile>');
  process.exit(1);
}

const require = createRequire(import.meta.url);
const esbuild = require(
  require.resolve('esbuild', { paths: [require.resolve('tsx/package.json')] }),
);

await esbuild.build({
  entryPoints: [fileURLToPath(new URL('./migrate.mjs', import.meta.url))],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  logLevel: 'warning',
});
console.log(`Bundled migration runner: ${outfile}`);
