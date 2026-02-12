/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'books.google.com' },
      { protocol: 'https', hostname: 'covers.openlibrary.org' },
    ],
  },
  // Configure build caching
  distDir: '.next',
  // Disable ESLint during builds to prevent warnings from failing production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optimize for Cloudflare Pages deployment
  webpack: (config) => {
    // Enable filesystem cache for GitHub Actions builds
    if (process.env.GITHUB_ACTIONS) {
      const path = require('path');
      config.cache = {
        type: 'filesystem',
        cacheDirectory: path.resolve('.next/cache/webpack'),
        maxMemoryGenerations: 2,
      };
    } else if (config.cache && config.cache.type === 'filesystem') {
      config.cache.maxMemoryGenerations = 1;
    }
    
    return config;
  },
  // Disable source maps in production to reduce file sizes
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig