import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  optimizeFonts: true,
  swcMinify: true,
  
  // Enable prefetching for fast navigation
  experimental: {
    // Enable optimizeCss for better performance
    optimizeCss: true,
    // Optimize prefetching
    optimisticClientCache: true
  }
};

export default nextConfig;
