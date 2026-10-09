/**
 * Bundles maintenance scripts (with their dependencies) into single files,
 * so they run in the Docker image without node_modules. Used by
 * assemble-image.sh:
 *
 *   node apps/web/scripts/bundle-tools.mjs <out dir>
 *     -> <out dir>/copy-uploads-to-r2.mjs
 *
 * esbuild comes from tsx (a dev dependency), as in libs/db/scripts/bundle-migrate.mjs.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = process.argv[2];
if (!outDir) {
  console.error('Usage: node bundle-tools.mjs <out dir>');
  process.exit(1);
}

const require = createRequire(import.meta.url);
const esbuild = require(
  require.resolve('esbuild', { paths: [require.resolve('tsx/package.json')] }),
);

for (const name of ['copy-uploads-to-r2.mjs']) {
  await esbuild.build({
    entryPoints: [fileURLToPath(new URL(`./${name}`, import.meta.url))],
    outfile: path.join(outDir, name),
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    logLevel: 'warning',
  });
  console.log(`Bundled ${path.join(outDir, name)}`);
}
