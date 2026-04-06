import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: '.',
  },
  // GitHub Pages static export
  // Note: API routes, auth, and dynamic features require server-side rendering.
  // For full functionality, deploy to Vercel. GitHub Pages hosts the static UI only.
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
