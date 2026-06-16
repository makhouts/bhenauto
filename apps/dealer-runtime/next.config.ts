import path from "node:path";
import type { NextConfig } from "next";
import { getStaticDealerBootstraps } from "../../packages/dealers/registry/src";

const isDev = process.env.NODE_ENV === "development";
const staticDealerOrigins = getStaticDealerBootstraps().flatMap((dealer) => [
  dealer.primaryDomain,
  ...dealer.domains,
]);
const staticImageHosts = Array.from(new Set([
  ...staticDealerOrigins,
  ...getStaticDealerBootstraps().flatMap((dealer) => {
    if (!dealer.siteUrl) return [];

    try {
      return [new URL(dealer.siteUrl).hostname];
    } catch {
      return [];
    }
  }),
  ...[process.env.NEXT_PUBLIC_R2_PUBLIC_URL, process.env.NEXT_PUBLIC_IMAGE_CDN_ORIGIN].flatMap((value) => {
    if (!value) return [];

    try {
      return [new URL(value).hostname];
    } catch {
      return [];
    }
  }),
]).values());

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
  ...staticDealerOrigins,
  ...(process.env.SERVER_ACTION_ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? []),
];
if (isDev) serverActionOrigins.push("localhost:3000");

// Keep Next.js' default HTML-limited bot behavior and include Lighthouse/PageSpeed.
// This makes dynamic metadata block for audits so SEO meta tags are present in <head>.
const htmlLimitedBots =
  /Mediapartners-Google|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Lighthouse|Chrome-Lighthouse|PageSpeed/i;

const nextConfig: NextConfig = {
  htmlLimitedBots,
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
  experimental: {
    externalDir: true,
    globalNotFound: true,
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
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|ico|mp4|webmanifest)",
        headers: [
          ...securityHeaders,
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
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
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: staticImageHosts.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
};

export default nextConfig;
