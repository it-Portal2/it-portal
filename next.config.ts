import type { NextConfig } from "next";

const nextConfig = {
  //output: "export",
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  trailingSlash: true,
  experimental: {
    nodeMiddleware: true,
  },
} as NextConfig;

export default nextConfig;
