"use server";

import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { carCardSelect, withCardPreviews, type CarCardData } from "@/lib/cars/card-data";
import { INVENTORY_CACHE_OPTIONS } from "@/lib/cars/cache-policy";
import { getInventoryWindow } from "@/lib/cars/inventory-window";
import { Prisma } from "@/generated/prisma/client";
import type { Locale } from "@/lib/i18n";
import {
    PRICE_RANGE_CONFIG,
    MILEAGE_RANGE_CONFIG,
    normalizeQueryRange,
} from "@/lib/inventoryFilterRanges";
import { localizeCarsForPublic } from "@/lib/autoscout24/public-presentation";

export type CarWithImages = Omit<CarCardData, "createdAt"> & {
    createdAt: string;
    description: string;
    isNew: boolean;
    images: { url: string }[];
};

interface FetchCarsParams {
    page?: number;
    pageSize?: number;
    locale?: Locale;
    brand?: string | string[];
    query?: string;
    sort?: string;
    type?: string | string[];
    minPrice?: string;
    maxPrice?: string;
    minMileage?: string;
    maxMileage?: string;
    fuel?: string | string[];
    transmission?: string | string[];
}

const NEW_BADGE_LIFETIME_MS = 2 * 24 * 60 * 60 * 1000;
function getInventoryOrder(sort?: string): Prisma.CarOrderByWithRelationInput[] {
    if (sort === "price_asc") {
        return [{ price: "asc" }, { createdAt: "desc" }, { id: "asc" }];
    }

    if (sort === "price_desc") {
        return [{ price: "desc" }, { createdAt: "desc" }, { id: "asc" }];
    }

    if (sort === "year_desc") {
        return [{ year: "desc" }, { createdAt: "desc" }, { id: "asc" }];
    }

    if (sort === "mileage_asc") {
        return [{ mileage: "asc" }, { createdAt: "desc" }, { id: "asc" }];
    }

    return [{ createdAt: "desc" }, { id: "asc" }];
}

function withSoldFilter(where: Prisma.CarWhereInput, sold: boolean): Prisma.CarWhereInput {
    if (Object.keys(where).length === 0) return { sold };
    return { AND: [where, { sold }] };
}

const filterList = z.union([z.string(), z.array(z.string()).max(20)]).optional()
    .transform((value) => [...new Set((Array.isArray(value) ? value : value ? [value] : [])
        .map((entry) => entry.trim().slice(0, 80)).filter(Boolean))].sort());
const filterSchema = z.object({
    brand: filterList, type: filterList, fuel: filterList, transmission: filterList,
    query: z.string().optional().transform((value) => value?.trim().slice(0, 80) || undefined),
    sort: z.enum(["price_asc", "price_desc", "year_desc", "mileage_asc", "newest"]).catch("newest").default("newest"),
    minPrice: z.string().optional(), maxPrice: z.string().optional(),
    minMileage: z.string().optional(), maxMileage: z.string().optional(),
});

type Filters = z.output<typeof filterSchema>;

function buildWhere({ brand, query: safeQuery, type, minPrice, maxPrice, minMileage, maxMileage, fuel, transmission }: Filters) {
    const conditions: Prisma.CarWhereInput[] = [];

    if (brand.length > 0) {
        if (Array.isArray(brand)) {
            conditions.push({ brand: { in: brand } });
        } else {
            conditions.push({ brand });
        }
    }

    if (type.length > 0) {
        const types = Array.isArray(type) ? type : [type];
        conditions.push({
            OR: types.flatMap((t: string) => [
                { model: { contains: t, mode: "insensitive" as const } },
                { description: { contains: t, mode: "insensitive" as const } },
            ]),
        });
    }

    const priceRange = normalizeQueryRange(minPrice, maxPrice, PRICE_RANGE_CONFIG);
    if (priceRange.min > PRICE_RANGE_CONFIG.min || priceRange.max < PRICE_RANGE_CONFIG.max) {
        conditions.push({
            price: {
                ...(priceRange.min > PRICE_RANGE_CONFIG.min ? { gte: priceRange.min } : {}),
                ...(priceRange.max < PRICE_RANGE_CONFIG.max ? { lte: priceRange.max } : {}),
            },
        });
    }

    const mileageRange = normalizeQueryRange(minMileage, maxMileage, MILEAGE_RANGE_CONFIG);
    if (mileageRange.min > MILEAGE_RANGE_CONFIG.min || mileageRange.max < MILEAGE_RANGE_CONFIG.max) {
        conditions.push({
            mileage: {
                ...(mileageRange.min > MILEAGE_RANGE_CONFIG.min ? { gte: mileageRange.min } : {}),
                ...(mileageRange.max < MILEAGE_RANGE_CONFIG.max ? { lte: mileageRange.max } : {}),
            },
        });
    }

    if (fuel) {
        const fuels = Array.isArray(fuel) ? fuel : [fuel];
        if (fuels.length > 0 && fuels[0] !== "") {
            conditions.push({
                OR: [
                    { fuelCategory: { in: fuels } },
                    { fuel_type: { in: fuels } },
                ],
            });
        }
    }

    if (transmission) {
        const transmissions = Array.isArray(transmission) ? transmission : [transmission];
        if (transmissions.length > 0 && transmissions[0] !== "") {
            conditions.push({ transmission: { in: transmissions } });
        }
    }

    if (safeQuery) {
        conditions.push({
            OR: [
                { title: { contains: safeQuery, mode: "insensitive" } },
                { brand: { contains: safeQuery, mode: "insensitive" } },
                { model: { contains: safeQuery, mode: "insensitive" } },
            ],
        });
    }

    const where: Prisma.CarWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    return where;
}

const getCounts = unstable_cache(async (filters: Filters) => {
    const groups = await prisma.car.groupBy({
        by: ["sold"], where: buildWhere(filters), _count: { _all: true },
    });
    return {
        available: groups.find((group) => !group.sold)?._count._all ?? 0,
        sold: groups.find((group) => group.sold)?._count._all ?? 0,
    };
}, ["inventory-counts-v2"], INVENTORY_CACHE_OPTIONS);

const getPage = unstable_cache(async (filters: Filters, page: number, pageSize: number) => {
    const counts = await getCounts(filters);
    const window = getInventoryWindow(counts.available, counts.sold, (page - 1) * pageSize, pageSize);
    const where = buildWhere(filters);
    const orderBy = getInventoryOrder(filters.sort);
    const [availableCars, soldCars] = await Promise.all([
        window.available.take ? prisma.car.findMany({
            where: withSoldFilter(where, false), orderBy, ...window.available, select: carCardSelect,
        }) : [],
        window.sold.take ? prisma.car.findMany({
            where: withSoldFilter(where, true), orderBy, ...window.sold, select: carCardSelect,
        }) : [],
    ]);
    let availableIndex = 0;
    let soldIndex = 0;
    const cars = window.order.map((sold) => sold ? soldCars[soldIndex++] : availableCars[availableIndex++])
        .filter((car): car is CarCardData => Boolean(car));
    return {
        cars: (await withCardPreviews(cars)).map((car) => ({ ...car, createdAt: car.createdAt.toISOString() })),
        hasMore: window.hasMore && cars.length > 0,
        total: window.total,
    };
}, ["inventory-page-v3"], INVENTORY_CACHE_OPTIONS);

export async function fetchCarsPaginated(params: FetchCarsParams): Promise<{
    cars: CarWithImages[];
    hasMore: boolean;
    total: number;
}> {
    // Server Action arguments are untrusted. Bound work before constructing queries.
    const page = z.number().int().min(1).max(10000).default(1).parse(params.page);
    const pageSize = z.number().int().min(1).max(24).default(9).parse(params.pageSize);
    const locale = z.enum(["nl", "fr", "en"]).default("nl").parse(params.locale);
    const filters = filterSchema.parse(params);
    const price = normalizeQueryRange(filters.minPrice, filters.maxPrice, PRICE_RANGE_CONFIG);
    const mileage = normalizeQueryRange(filters.minMileage, filters.maxMileage, MILEAGE_RANGE_CONFIG);
    const canonicalFilters = {
        ...filters,
        minPrice: String(price.min), maxPrice: String(price.max),
        minMileage: String(mileage.min), maxMileage: String(mileage.max),
    };
    const result = await getPage(canonicalFilters, page, pageSize);
    const cars = await localizeCarsForPublic(result.cars, locale);
    return {
        ...result,
        cars: cars.map((car) => {
            const age = Date.now() - new Date(car.createdAt).getTime();
            return { ...car, isNew: age >= 0 && age < NEW_BADGE_LIFETIME_MS };
        }),
    };
}
