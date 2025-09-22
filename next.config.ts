import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['@prisma/client', 'prisma'],
  eslint: {
    // Only run ESLint on specific directories during production builds
    dirs: ['app', 'components', 'lib'],
  },
};

export default nextConfig;
