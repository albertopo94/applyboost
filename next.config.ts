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
  // Extreme RAM savings for small VPS
  experimental: {
    workerThreads: false,
    cpus: 1,
    webpackMemoryOptimizations: true,
  },
  // Optimization for low-RAM environments
  webpack: (config) => {
    config.cache = false;
    // Disable heavy optimizations that consume RAM
    if (config.optimization) {
      config.optimization.minimize = true; // Still minimize, but we already limited to 1 worker
    }
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
