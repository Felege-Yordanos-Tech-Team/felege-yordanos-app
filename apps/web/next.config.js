//@ts-check

const { composePlugins, withNx } = require('@nx/next');
const withPWAInit = require('@ducanh2912/next-pwa').default;

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  distDir: '../../dist/apps/web',
  nx: {},
};

const plugins = [withNx, withPWA];

module.exports = composePlugins(...plugins)(nextConfig);
