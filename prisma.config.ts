import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * Prisma v7 configuration file.
 * Connection URLs are defined here instead of in schema.prisma.
 * - DATABASE_URL  : pooled / main connection (used by PrismaClient at runtime)
 * - DIRECT_URL   : direct (non-pooled) connection (used by Prisma Migrate)
 */
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL!,
    // shadowDatabaseUrl is used by Migrate for direct connections (bypass pooler)
    ...(process.env.DIRECT_URL ? { shadowDatabaseUrl: process.env.DIRECT_URL } : {}),
  },
});
