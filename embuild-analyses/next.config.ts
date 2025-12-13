import { withContentlayer } from 'next-contentlayer'
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const repoName = 'data-blog';

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',
};

export default withContentlayer(nextConfig);
