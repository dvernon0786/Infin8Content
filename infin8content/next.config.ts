import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
