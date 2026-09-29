import "server-only";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

// One locale-independent dictionary per day, rather than a query for every
// card group, filter menu, and equipment list. No private vehicle data.
export const getPublicReferences = unstable_cache(() => prisma.autoScoutReference.findMany({
  where: { referenceType: { in: ["FuelType", "FuelCategory", "Transmission", "BodyColor", "Equipment"] } },
  select: { referenceType: true, referenceId: true, nameNl: true, nameFr: true, nameEn: true },
}), ["public-vehicle-references-v1"], { revalidate: 86400 });
