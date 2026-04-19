import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

export const getAllBrands = unstable_cache(
  async () => {
    const rows = await prisma.car.findMany({
      select: { brand: true },
      distinct: ["brand"],
    });
    return rows.map((r) => r.brand).filter(Boolean).sort() as string[];
  },
  ["all-brands"],
  { revalidate: 300, tags: ["cars"] }
);
