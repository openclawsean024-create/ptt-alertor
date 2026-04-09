import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // For Vercel deployment with SSR support
  // (Do NOT use output: 'export' - that disables API routes & Clerk auth)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
