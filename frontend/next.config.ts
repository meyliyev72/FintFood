import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fintfood-backend.onrender.com",
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;