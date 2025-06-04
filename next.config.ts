import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL("https://images.compara.ar/**"),
      new URL("https://compara.b-cdn.net/**"),
    ],
  },
  redirects: async () => {
    return [
      {
        source: "/debts/search",
        destination: "/deudores",
        permanent: true,
      },
    ];
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
