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
        destination: "/central-de-deudores",
        permanent: true,
      },
      {
        source: "/deudores/:path*",
        destination: "/central-de-deudores/:path*",
        permanent: true,
      },
      {
        source: "/inflation-calculator",
        destination: "/calculadora-de-inflacion",
        permanent: true,
      },
      {
        source: "/duales",
        destination: "/bonos-duales",
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
