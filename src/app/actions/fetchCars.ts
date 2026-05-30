"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { Locale } from "@/lib/i18n";
import {
    PRICE_RANGE_CONFIG,
    MILEAGE_RANGE_CONFIG,
    normalizeQueryRange,
} from "@/lib/inventoryFilterRanges";
import { localizeCarsForPublic } from "@/lib/autoscout24/public-presentation";

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
const AVAILABLE_CARS_PER_SOLD_CAR = 3;

function isRecentlyCreated(createdAt: Date): boolean {
    const ageMs = Date.now() - createdAt.getTime();
    return ageMs >= 0 && ageMs < NEW_BADGE_LIFETIME_MS;
}

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

function mixAvailableAndSoldCars<T>(availableCars: T[], soldCars: T[], limit: number): T[] {
    const mixedCars: T[] = [];
    let availableIndex = 0;
    let soldIndex = 0;

    while (
        mixedCars.length < limit &&
        (availableIndex < availableCars.length || soldIndex < soldCars.length)
    ) {
        for (
            let i = 0;
            i < AVAILABLE_CARS_PER_SOLD_CAR &&
            availableIndex < availableCars.length &&
            mixedCars.length < limit;
            i += 1
        ) {
            mixedCars.push(availableCars[availableIndex]);
            availableIndex += 1;
        }

        if (soldIndex < soldCars.length && mixedCars.length < limit) {
            mixedCars.push(soldCars[soldIndex]);
            soldIndex += 1;
        }

        if (availableIndex >= availableCars.length) {
            while (soldIndex < soldCars.length && mixedCars.length < limit) {
                mixedCars.push(soldCars[soldIndex]);
                soldIndex += 1;
            }
        }

        if (soldIndex >= soldCars.length) {
            while (availableIndex < availableCars.length && mixedCars.length < limit) {
                mixedCars.push(availableCars[availableIndex]);
                availableIndex += 1;
            }
        }
    }

    return mixedCars;
}

export async function fetchCarsPaginated(params: FetchCarsParams): Promise<{
    cars: CarWithImages[];
    hasMore: boolean;
    total: number;
}> {
    const { brand, query, sort, type, minPrice, maxPrice, minMileage, maxMileage, fuel, transmission } = params;
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

    const skip = (page - 1) * pageSize;
    const take = skip + pageSize;
    const orderBy = getInventoryOrder(sort);
    const include = { images: { orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }], take: 2 } };

    const [availableCars, soldCars, total] = await Promise.all([
        prisma.car.findMany({
            where: withSoldFilter(where, false),
            orderBy,
            take,
            include,
        }),
        prisma.car.findMany({
            where: withSoldFilter(where, true),
            orderBy,
            take,
            include,
        }),
        prisma.car.count({ where }),
    ]);

    const cars = mixAvailableAndSoldCars(availableCars, soldCars, take).slice(skip, skip + pageSize);
    const localizedCars = await localizeCarsForPublic(cars, params.locale ?? "nl");

    return {
        cars: localizedCars.map((car) => ({
            ...car,
            isNew: isRecentlyCreated(car.createdAt),
        })) as unknown as CarWithImages[],
        hasMore: skip + cars.length < total,
        total,
    };
}
