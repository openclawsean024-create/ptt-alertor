import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: '.',
  },
  // Vercel deployment with API routes and auth support.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
