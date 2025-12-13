import { withContentlayer } from 'next-contentlayer'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default withContentlayer(nextConfig);
