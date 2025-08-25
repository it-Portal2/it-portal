import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  //output: "export",
  async headers() {
    return [
      {
        // Apply these headers to all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "Content-Type, Authorization, X-Requested-With, Accept, Origin",
          },
          { key: "Access-Control-Allow-Credentials", value: "false" },
        ],
      },
    ];
  },
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  trailingSlash: true, // Recommended
  experimental: {
    nodeMiddleware: true,
  },
};

export default nextConfig;
