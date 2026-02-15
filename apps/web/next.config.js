const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/config/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = withNextIntl(nextConfig);

