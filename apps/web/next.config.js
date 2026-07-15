const path = require('node:path');
const createNextIntlPlugin = require('next-intl/plugin');
const { getLanIpv4Addresses } = require('./scripts/lan-ipv4.cjs');

const withNextIntl = createNextIntlPlugin('./src/config/i18n.ts');
/** Pin Turbopack to the monorepo root so stray parent lockfiles (e.g. %USERPROFILE%) are ignored. */
const monorepoRoot = path.join(__dirname, '../..');

function getDevelopmentAllowedDevOrigins() {
  return [
    ...getLanIpv4Addresses(),
    '192.168.*.*',
    '10.*.*.*',
    '172.*.*.*',
  ];
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.NODE_ENV !== 'production' && {
    allowedDevOrigins: getDevelopmentAllowedDevOrigins(),
  }),
  // Turbopack (replaces deprecated experimental.turbo)
  turbopack: {
    root: monorepoRoot,
  },
  outputFileTracingRoot: monorepoRoot,
  images: {
    formats: ['image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudflare.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/favicon.ico',
        destination: '/icon.png',
      },
    ];
  },
  // Development optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Faster refresh in development
    reactStrictMode: true,

    // Optimize webpack for development (only if not using Turbopack)
    // Note: With --turbo flag, webpack config is ignored
    webpack: (config, { dev, isServer: _isServer }) => {
      if (dev && !process.env.TURBOPACK) {
        // Faster builds in development
        config.optimization = {
          ...config.optimization,
          removeAvailableModules: false,
          removeEmptyChunks: false,
          splitChunks: false,
        };

        // Faster source maps in development
        if (config.devtool) {
          config.devtool = 'eval-cheap-module-source-map';
        }
      }
      return config;
    },
  }),
};

// Apply next-intl, then migrate experimental.turbo -> turbopack (next-intl injects it)
const configWithIntl = withNextIntl(nextConfig);
const { experimental, ...rest } = configWithIntl;
const turboFromExperimental = experimental?.turbo;
const experimentalRest = experimental ? { ...experimental } : {};
delete experimentalRest.turbo;

/** @type {import('next').NextConfig} */
const finalConfig = {
  ...rest,
  turbopack: {
    ...(rest.turbopack || {}),
    ...(turboFromExperimental || {}),
  },
};
if (Object.keys(experimentalRest).length > 0) {
  finalConfig.experimental = experimentalRest;
}

module.exports = finalConfig;

