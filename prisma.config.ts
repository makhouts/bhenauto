import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

const datasourceUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!datasourceUrl) {
  throw new Error("DIRECT_URL or DATABASE_URL must be set before running Prisma commands.");
}

/**
 * Prisma v7 configuration file.
 * Connection URLs are defined here instead of in schema.prisma.
 * - DATABASE_URL : pooled / main connection (used by PrismaClient at runtime)
 * - DIRECT_URL   : direct non-pooled connection, preferred for Prisma Migrate
 */
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: datasourceUrl,
  },
});
