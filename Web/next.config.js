/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emits .next/standalone — a self-contained server plus only the
  // node_modules it actually uses. That folder is what gets packaged into
  // the desktop installer, so the UI runs locally instead of needing a
  // second hosted service.
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  },
  webpack: (config, { dev }) => {
    // This dev machine runs low on RAM; webpack's persistent disk cache
    // (gzip-serialized pack files) crashes with ERR_MEMORY_ALLOCATION_FAILED
    // under that pressure. Disabling it in dev trades slower rebuilds for a
    // server that doesn't die mid-session. No effect on production builds.
    if (dev) {
      config.cache = false;
    }
    return config;
  },
}

module.exports = nextConfig
