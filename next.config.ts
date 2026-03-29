import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Disable type checking and linting during build to save RAM on the VPS
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  productionBrowserSourceMaps: false,
  images: {
    unoptimized: true,
  },
  // Extreme RAM savings for small VPS - Official Next.js 15 optimizations
  experimental: {
    workerThreads: false,
    cpus: 1,
    webpackMemoryOptimizations: true,
  },
  // Disable webpack cache to prevent hanging on low-resource environments
  webpack: (config) => {
    config.cache = false;
    return config;
  },
  // Security headers (SDD §9.2)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
