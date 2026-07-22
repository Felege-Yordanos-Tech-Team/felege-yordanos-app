//@ts-check

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
  experimental: {
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
