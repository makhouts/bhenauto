import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { carCardSelect, withCardImages } from "./card-data";
import { INVENTORY_CACHE_OPTIONS } from "./cache-policy";

export const getFeaturedCars = unstable_cache(async () => withCardImages(await prisma.car.findMany({
  orderBy: [{ featured: "desc" }, { createdAt: "desc" }, { id: "asc" }],
  take: 12,
  select: { ...carCardSelect, description: false },
}), 1), ["featured-cars-v2"], INVENTORY_CACHE_OPTIONS);

export const getPublicCar = cache(unstable_cache((slug: string) => prisma.car.findUnique({
  where: { slug },
  select: {
    ...carCardSelect,
    color: true, exteriorColor: true, exteriorColorCode: true, manufacturerColorName: true,
    description: true, carpass_url: true, features: true, equipmentCodes: true,
    bodyType: true, vehicleType: true,
    images: { select: { id: true, url: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }] },
  },
}), ["public-car-v2"], INVENTORY_CACHE_OPTIONS));

export const getSitemapCars = unstable_cache(() => prisma.car.findMany({
  select: { slug: true, title: true, brand: true, model: true, year: true, sold: true, updatedAt: true },
  orderBy: [{ brand: "asc" }, { model: "asc" }, { id: "asc" }],
}), ["sitemap-cars-v2"], INVENTORY_CACHE_OPTIONS);
