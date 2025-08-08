/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['books.google.com', 'covers.openlibrary.org'],
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
    } else if (process.env.CF_PAGES) {
      // Disable filesystem cache for Cloudflare Pages to avoid large files
      config.cache = false;
    } else if (config.cache && config.cache.type === 'filesystem') {
      // Reduce webpack cache size for other deployments
      config.cache.maxMemoryGenerations = 1;
    }
    
    return config;
  },
  // Additional optimizations
  swcMinify: true,
  compress: true,
  // Disable source maps in production to reduce file sizes
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig