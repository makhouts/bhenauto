import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import "../env";

const prismaClientSingleton = () => {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    return new PrismaClient({ adapter });
};

declare global {
    var platformPrismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.platformPrismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
    globalThis.platformPrismaGlobal = prisma;
}

export default prisma;
