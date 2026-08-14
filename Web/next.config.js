// The version shown in the header badge should always match whatever
// Desktop/package.json currently says, so it stays in lockstep with the
// CI-bumped desktop release without anyone remembering to update an env
// file. Read once at build/dev-server-start time and inject as a public
// env var; NEXT_PUBLIC_APP_VERSION in .env.local can still override.
const desktopPackage = require('../Desktop/package.json');
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || desktopPackage.version;

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
    NEXT_PUBLIC_APP_VERSION: APP_VERSION,
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
