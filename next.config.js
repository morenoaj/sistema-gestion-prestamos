/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Turbo config para Next.js 14
    turbo: {
      rules: {},
      resolveAlias: {}
    }
  },
  swcMinify: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
}

module.exports = nextConfig