import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Sur quialaref.fr, /wiki/* redirige vers wikiref.fr
      {
        source: "/wiki",
        destination: "https://wikiref.fr",
        permanent: false,
        has: [{ type: "host" as const, value: "quialaref.fr" }],
      },
      {
        source: "/wiki/:path*",
        destination: "https://wikiref.fr/:path*",
        permanent: false,
        has: [{ type: "host" as const, value: "quialaref.fr" }],
      },
    ];
  },
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
