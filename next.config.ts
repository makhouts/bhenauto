import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// CSP lives in middleware.ts so each request gets a fresh nonce for inline scripts.
// Other security headers are static and applied here.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const serverActionOrigins = ["bhenauto.be", "www.bhenauto.be"];
if (isDev) serverActionOrigins.push("localhost:3000");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: serverActionOrigins,
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Aggressively cache immutable Next.js static chunks (they're content-hashed)
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  images: {
    qualities: [25, 50, 75, 80, 90, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // R2 CDN — custom domain
      {
        protocol: "https",
        hostname: "images.bhenauto.com",
      },
      // R2 public bucket URL
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
    ],
  },
};

export default nextConfig;
