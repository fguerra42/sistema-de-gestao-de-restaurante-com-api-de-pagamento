import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "10.0.0.10",
        port: "3006",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
