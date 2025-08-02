// esbuild configuration for Wrangler
module.exports = {
  plugins: [
    {
      name: 'crypto-external',
      setup(build) {
        build.onResolve({ filter: /^crypto$/ }, () => ({
          path: 'crypto',
          external: true,
        }));
        build.onResolve({ filter: /^node:crypto$/ }, () => ({
          path: 'node:crypto',
          external: true,
        }));
      },
    },
  ],
};