import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const r2PublicHost = process.env.NEXT_PUBLIC_R2_PUBLIC_URL
  ? new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_URL).hostname
  : null;

// Static security headers applied by the app. If a CSP is added here or at
// the edge, allow Turnstile scripts and frames from challenges.cloudflare.com.
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

const serverActionOrigins = [
  "bhenauto.com",
  "www.bhenauto.com",
  ...(process.env.SERVER_ACTION_ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? []),
];
if (isDev) serverActionOrigins.push("localhost:3000");

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
  experimental: {
    serverActions: {
      allowedOrigins: serverActionOrigins,
    },
    optimizePackageImports: ["lucide-react", "motion"],
    // Extend client-side router cache so navigating back to a page
    // doesn't re-fetch when the content hasn't changed.
    // static  = pages with `export const revalidate` (ISR) → 5 min client cache
    // dynamic = pages without revalidate → 2 min client cache
    staleTimes: {
      static: 300,
      dynamic: 120,
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [25, 50, 60, 65, 70, 75, 80, 90, 100],
    remotePatterns: [
      // R2 CDN — custom domain
      {
        protocol: "https",
        hostname: "images.bhenauto.com",
      },
      ...(r2PublicHost && r2PublicHost !== "images.bhenauto.com"
        ? [{
            protocol: "https" as const,
            hostname: r2PublicHost,
          }]
        : []),
    ],
  },
};

export default nextConfig;
