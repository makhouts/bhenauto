"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
    PRICE_RANGE_CONFIG,
    MILEAGE_RANGE_CONFIG,
    normalizeQueryRange,
} from "@/lib/inventoryFilterRanges";

export type CarWithImages = {
    id: string;
    slug: string;
    title: string;
    brand: string;
    model: string;
    year: number;
    mileage: number;
    fuel_type: string;
    transmission: string;
    price: number;
    horsepower: number;
    color: string;
    description: string;
    featured: boolean;
    sold: boolean;
    reserved: boolean;
    createdAt: Date;
    updatedAt: Date;
    isNew: boolean;
    images: { url: string }[];
};

interface FetchCarsParams {
    page?: number;
    pageSize?: number;
    brand?: string | string[];
    query?: string;
    sort?: string;
    type?: string | string[];
    minPrice?: string;
    maxPrice?: string;
    minMileage?: string;
    maxMileage?: string;
    fuel?: string | string[];
}

const NEW_BADGE_LIFETIME_MS = 2 * 24 * 60 * 60 * 1000;

function isRecentlyCreated(createdAt: Date): boolean {
    const ageMs = Date.now() - createdAt.getTime();
    return ageMs >= 0 && ageMs < NEW_BADGE_LIFETIME_MS;
}

export async function fetchCarsPaginated(params: FetchCarsParams): Promise<{
    cars: CarWithImages[];
    hasMore: boolean;
    total: number;
}> {
    const { brand, query, sort, type, minPrice, maxPrice, minMileage, maxMileage, fuel } = params;
    const page = Math.max(1, Math.trunc(params.page ?? 1));
    const pageSize = Math.min(24, Math.max(1, Math.trunc(params.pageSize ?? 9)));
    const safeQuery = query?.trim().slice(0, 80);

    const conditions: Prisma.CarWhereInput[] = [];

    if (brand) {
        if (Array.isArray(brand)) {
            conditions.push({ brand: { in: brand } });
        } else {
            conditions.push({ brand });
        }
    }

    if (type) {
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
            conditions.push({ fuel_type: { in: fuels } });
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

    let orderBy: Prisma.CarOrderByWithRelationInput;
    if (sort === "price_asc") orderBy = { price: "asc" };
    else if (sort === "price_desc") orderBy = { price: "desc" };
    else if (sort === "year_desc") orderBy = { year: "desc" };
    else if (sort === "mileage_asc") orderBy = { mileage: "asc" };
    else orderBy = { createdAt: "desc" };

    const skip = (page - 1) * pageSize;

    const [cars, total] = await Promise.all([
        prisma.car.findMany({
            where,
            orderBy,
            skip,
            take: pageSize,
            include: { images: { orderBy: { createdAt: "asc" }, take: 2 } },
        }),
        prisma.car.count({ where }),
    ]);

    return {
        cars: cars.map((car) => ({
            ...car,
            isNew: isRecentlyCreated(car.createdAt),
        })) as unknown as CarWithImages[],
        hasMore: skip + cars.length < total,
        total,
    };
}
