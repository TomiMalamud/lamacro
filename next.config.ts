import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL("https://images.compara.ar/**"),
      new URL("https://compara.b-cdn.net/**"),
    ],
  },
};

export default nextConfig;
