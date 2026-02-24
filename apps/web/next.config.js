const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/config/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack (replaces deprecated experimental.turbo)
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudflare.com',
      },
    ],
  },
  // Development optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Faster refresh in development
    reactStrictMode: true,

    // Optimize webpack for development (only if not using Turbopack)
    // Note: With --turbo flag, webpack config is ignored
    webpack: (config, { dev, isServer }) => {
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

