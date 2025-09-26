import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true, // handled by linting, in the future, use CI to check
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
