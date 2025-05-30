/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  // Ensure we generate proper favicon
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  }
};

module.exports = nextConfig;
