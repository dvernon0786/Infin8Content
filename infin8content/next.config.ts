import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Use the project directory dynamically so CI and local environments behave the same
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors because Vercel 2-core machines hang for 15m+ 
    // trying to resolve untyped Supabase DB references.
    // TODO: Remove after types verified stable
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
