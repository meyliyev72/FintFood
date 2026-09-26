import type { NextConfig } from "next";

/**
 * FintFood runs as a real SSR/ISR Next.js service (`next start`).
 *
 * Public pages (home, recipes, recipe detail, categories) are React Server
 * Components that fetch from the Django API with `revalidate`, so they are
 * server-rendered and crawlable. A static export is deliberately NOT used:
 * it cannot do per-request rendering, `next/image` optimisation, or
 * on-demand revalidation.
 */

const mediaHost = process.env.NEXT_PUBLIC_MEDIA_HOST || "localhost";
const mediaPort = process.env.NEXT_PUBLIC_MEDIA_PORT || "8000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Server Components calling the Django API during SSR/ISR must reach it
  // directly (not through the public API URL, which may be blocked by CORS
  // or point at a different network namespace on Render).
  async rewrites() {
    return {
      beforeFiles: [
        // Proxy /media/* to the Django media host so <Image> can optimise
        // uploaded recipe/category photos without exposing the API host.
        {
          source: "/media/:path*",
          destination: `${process.env.API_URL || `http://${mediaHost}:${mediaPort}`}/media/:path*`,
        },
      ],
    };
  },

  images: {
    // Allow the local dev API, the production API host and Render subdomains.
    remotePatterns: [
      { protocol: "http", hostname: mediaHost, port: mediaPort, pathname: "/media/**" },
      { protocol: "https", hostname: "**.onrender.com", pathname: "/media/**" },
      { protocol: "https", hostname: "**", pathname: "/media/**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
