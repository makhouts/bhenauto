import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
  experimental: {
    externalDir: true,
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
