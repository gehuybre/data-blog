import { withContentlayer } from 'next-contentlayer'
import path from 'node:path'

const isProd = process.env.NODE_ENV === 'production';
const repoName = 'data-blog';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',
  productionBrowserSourceMaps: false, // Disable source maps in production (reduces build output by ~44 MB)
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'contentlayer/generated': path.join(process.cwd(), '.contentlayer', 'generated'),
    }
    return config
  },
};

export default withContentlayer(nextConfig);
