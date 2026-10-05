//@ts-check

const path = require('node:path');
const { composePlugins, withNx } = require('@nx/next');
const withPWAInit = require('@ducanh2912/next-pwa').default;

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/offline.html',
  },
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
});

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {},
  // Docker image (apps/web/Dockerfile): a minimal server in .next/standalone.
  output: 'standalone',
  // Monorepo: trace files from the repo root so libs/* and the root
  // node_modules are included in the standalone output.
  outputFileTracingRoot: path.join(__dirname, '../..'),
  // lib/storage.ts reads and writes files at runtime paths (UPLOAD_DIR). The
  // file tracer cannot tell those apart from source files, so it would copy
  // the app's source and local uploads into the image. None of these are
  // needed at runtime: the compiled code is in .next.
  outputFileTracingExcludes: {
    '*': [
      'app/**',
      'components/**',
      'hooks/**',
      'lib/**',
      '.data/**',
      'proxy.ts',
      '*.config.{js,mjs}',
      'components.json',
      'project.json',
      'tsconfig.json',
    ],
  },
  experimental: {
    // Donation receipts (max 5 MB) are uploaded through a server action.
    serverActions: { bodySizeLimit: '6mb' },
    // Client-side Router Cache retention. In Next.js 16 the default reuse time
    // for dynamic pages is 0s, so navigating back to a route you just visited
    // discards its cached render, refetches the RSC payload (re-running every
    // Supabase query in the page + layout), and re-shows loading.tsx. Keeping
    // visited/prefetched pages "fresh" for a window makes page switches instant
    // with no skeleton. Mutations that call revalidatePath() (server actions) or
    // router.refresh() still bust this cache, so writes stay immediately visible.
    // Tune these numbers if a surface needs fresher data on re-entry.
    staleTimes: {
      dynamic: 300, // 5 min — reuse a visited dynamic page without refetching
      static: 300,
    },
    // Prefetch the FULL dynamic route (data included, not just the loading
    // boundary) when a link is hovered, so the first click on desktop lands on a
    // ready page instead of flashing the skeleton.
    dynamicOnHover: true,
  },
};

const plugins = [withNx, withPWA];

module.exports = composePlugins(...plugins)(nextConfig);
