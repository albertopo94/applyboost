import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [],
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
  // Reduce parallelization to save RAM
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  // Optimization for low-RAM environments
  webpack: (config, { isServer }) => {
    if (config.optimization) {
      config.optimization.minimize = true;
    }
    // Limit to 1 worker for minification
    const TerserPlugin = require('terser-webpack-plugin');
    config.optimization.minimizer = [
      new TerserPlugin({
        parallel: false,
      }),
    ];
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
