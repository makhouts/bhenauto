import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
// Side-effect import: validates env vars at boot, fails fast on misconfig.
import "@/lib/env";

const prismaClientSingleton = () => {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    max: 5,
    // This is a long-running Coolify server: reuse connections across quiet
    // periods instead of repeatedly fetching PostgreSQL type metadata.
    idleTimeoutMillis: 300_000,
    connectionTimeoutMillis: 10_000,
  });
  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

globalThis.prismaGlobal = prisma;
