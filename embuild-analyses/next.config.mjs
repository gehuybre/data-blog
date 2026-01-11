import { withContentlayer } from 'next-contentlayer'
import path from 'node:path'

const isProd = process.env.NODE_ENV === 'production';
const repoName = 'data-blog';
const basePath = isProd ? `/${repoName}` : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath,
  assetPrefix: isProd ? `/${repoName}/` : '',
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'contentlayer/generated': path.join(process.cwd(), '.contentlayer', 'generated'),
    }
    return config
  },
};

export default withContentlayer(nextConfig);
