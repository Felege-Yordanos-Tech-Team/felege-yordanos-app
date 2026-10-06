# Production image for apps/web. Two ways to build it, same result:
#
# 1. Self-contained (default target "app"): installs and builds inside Docker.
#    Works on any machine with Docker. Used by `pnpm docker:app`.
#      docker build -f apps/web/Dockerfile -t felege-web .
#
# 2. Prebuilt (target "prebuilt"): packages a build made outside Docker on
#    Linux x64 (CI). No install or build in Docker, so it takes seconds.
#      pnpm build && apps/web/scripts/assemble-image.sh /tmp/image
#      docker build -f apps/web/Dockerfile --target prebuilt \
#        --build-context prebuilt-files=/tmp/image -t felege-web .
#
# Run migrations, then the app:
#   docker run --rm -e DATABASE_URL=... felege-web node db/scripts/migrate.mjs
#   docker run -p 3000:3000 -e DATABASE_URL=... -e BETTER_AUTH_SECRET=... \
#     -e BETTER_AUTH_URL=... -v uploads:/data/uploads felege-web
#
# Base image: Debian slim (glibc), so a build made on the Ubuntu CI runner
# (native modules such as sharp) runs unchanged.

ARG NODE_VERSION=22

# ─── Runtime base: shared by both final targets ───
FROM node:${NODE_VERSION}-slim AS runtime-base
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOAD_DIR=/data/uploads
WORKDIR /app
RUN mkdir -p /data/uploads && chown node:node /data/uploads
VOLUME /data/uploads
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/up').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "apps/web/server.js"]

# ─── Prebuilt: package files from apps/web/scripts/assemble-image.sh ───
FROM runtime-base AS prebuilt
COPY --from=prebuilt-files / ./
# Writable only where the app writes: the Next.js cache (uploads: see above).
RUN mkdir -p apps/web/.next/cache && chown node:node apps/web/.next/cache
USER node

# ─── Builder (self-contained target only) ───
FROM node:${NODE_VERSION}-slim AS build
ENV PNPM_HOME=/pnpm \
    npm_config_store_dir=/pnpm/store \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /repo
# Download packages from the lockfile only: reused until the lockfile changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch --frozen-lockfile
COPY . .
RUN pnpm install --frozen-lockfile --offline
# Build-time placeholders only. Nothing connects to them, and they are not
# copied into the final image. Real values are passed when the container runs.
RUN NX_DAEMON=false NX_NO_CLOUD=true \
    DATABASE_URL=postgres://build:build@localhost:5432/build \
    BETTER_AUTH_SECRET=build-time-placeholder-not-used-at-runtime \
    BETTER_AUTH_URL=http://localhost:3000 \
    pnpm nx build web --skip-nx-cache && \
    sh apps/web/scripts/assemble-image.sh /out/image

# ─── App (default): self-contained build ───
FROM runtime-base AS app
COPY --from=build /out/image ./
RUN mkdir -p apps/web/.next/cache && chown node:node apps/web/.next/cache
USER node
