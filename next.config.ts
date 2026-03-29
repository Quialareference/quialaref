import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/wiki",
        has: [{ type: "host", value: "wikiref.fr" }],
      },
      {
        source: "/:path*",
        destination: "/wiki/:path*",
        has: [{ type: "host", value: "wikiref.fr" }],
      },
      {
        source: "/",
        destination: "/wiki",
        has: [{ type: "host", value: "www.wikiref.fr" }],
      },
      {
        source: "/:path*",
        destination: "/wiki/:path*",
        has: [{ type: "host", value: "www.wikiref.fr" }],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
    ],
  },
};

export default nextConfig;
