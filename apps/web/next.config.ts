import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@buildtrace/i18n', '@buildtrace/shared'],
};

export default nextConfig;
