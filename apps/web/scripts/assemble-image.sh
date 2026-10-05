#!/bin/sh
# Arranges a finished `pnpm build` into the folder layout of the runtime image:
#
#   <out>/apps/web/server.js        Next.js standalone server
#   <out>/apps/web/.next/static     client assets
#   <out>/apps/web/public           public files
#   <out>/node_modules              traced runtime dependencies
#   <out>/db/scripts/migrate.mjs    bundled migration runner
#   <out>/db/migrations             SQL migrations
#
# Used by apps/web/Dockerfile (self-contained build) and by CI (build once,
# then package). Run from the repo root after `pnpm build`.
set -eu

OUT="${1:-}"
case "$OUT" in
  '' | / | .) echo "usage: $0 <empty-or-new-output-dir>" >&2; exit 1 ;;
esac

WEB=apps/web
if [ ! -f "$WEB/.next/standalone/$WEB/server.js" ]; then
  echo "No standalone build found. Run 'pnpm build' first." >&2
  exit 1
fi

rm -rf "$OUT"
mkdir -p "$OUT"
cp -a "$WEB/.next/standalone/." "$OUT/"
rm -rf "$OUT/$WEB/public"
cp -a "$WEB/public" "$OUT/$WEB/public"
mkdir -p "$OUT/$WEB/.next"
cp -a "$WEB/.next/static" "$OUT/$WEB/.next/static"
node libs/db/scripts/bundle-migrate.mjs "$OUT/db/scripts/migrate.mjs"
cp -a libs/db/migrations "$OUT/db/migrations"

echo "Image files ready in $OUT"
