# Production image for apps/web.
# Build from the repo root (the app needs libs/* and the root lockfile):
#
#   docker build -f apps/web/Dockerfile -t felege-web .
#
# Run migrations, then the app:
#   docker run --rm -e DATABASE_URL=... felege-web node db/scripts/migrate.mjs
#   docker run -p 3000:3000 -e DATABASE_URL=... -e BETTER_AUTH_SECRET=... \
#     -e BETTER_AUTH_URL=... -v uploads:/data/uploads felege-web

ARG NODE_VERSION=22

# ─── Base: Node + pnpm (version from package.json "packageManager") ───
FROM node:${NODE_VERSION}-alpine AS base
ENV PNPM_HOME=/pnpm \
    npm_config_store_dir=/pnpm/store \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /repo

# ─── Dependencies: download packages from the lockfile only ───
# This layer (with the package store inside it) is reused until the lockfile
# changes, also from the CI layer cache.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch --frozen-lockfile

# ─── Build: install from the downloaded packages, build with Nx ───
FROM deps AS build
COPY . .
RUN pnpm install --frozen-lockfile --offline
# Build-time placeholders only. Nothing connects to them, and they are not
# copied into the final image. Real values are passed when the container runs.
RUN NX_DAEMON=false NX_NO_CLOUD=true \
    DATABASE_URL=postgres://build:build@localhost:5432/build \
    BETTER_AUTH_SECRET=build-time-placeholder-not-used-at-runtime \
    BETTER_AUTH_URL=http://localhost:3000 \
    pnpm nx build web --skip-nx-cache
# Migration runner: one bundled file plus the SQL migrations (no drizzle-kit).
RUN node libs/db/scripts/bundle-migrate.mjs /out/db/scripts/migrate.mjs && \
    cp -r libs/db/migrations /out/db/migrations

# ─── Runtime: only the standalone server, static files and migrations ───
FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOAD_DIR=/data/uploads
WORKDIR /app

COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public
COPY --from=build /out/db ./db

# Writable only where the app writes: Next.js cache and uploaded receipts.
RUN mkdir -p apps/web/.next/cache /data/uploads && \
    chown -R node:node apps/web/.next/cache /data/uploads
VOLUME /data/uploads

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/up || exit 1

CMD ["node", "apps/web/server.js"]
