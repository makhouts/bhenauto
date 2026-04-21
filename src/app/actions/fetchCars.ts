"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

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
    images: { url: string }[];
};

interface FetchCarsParams {
    page?: number;
    pageSize?: number;
    brand?: string | string[];
    query?: string;
    sort?: string;
    type?: string | string[];
    maxPrice?: string;
    maxMileage?: string;
    fuel?: string | string[];
}

export async function fetchCarsPaginated(params: FetchCarsParams): Promise<{
    cars: CarWithImages[];
    hasMore: boolean;
    total: number;
}> {
    const { page = 1, pageSize = 9, brand, query, sort, type, maxPrice, maxMileage, fuel } = params;

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

    if (maxPrice) {
        const parsedPrice = parseInt(maxPrice, 10);
        if (!isNaN(parsedPrice) && parsedPrice < 250000) {
            conditions.push({ price: { lte: parsedPrice } });
        }
    }

    if (maxMileage) {
        const parsedMileage = parseInt(maxMileage, 10);
        if (!isNaN(parsedMileage) && parsedMileage < 200000) {
            conditions.push({ mileage: { lte: parsedMileage } });
        }
    }

    if (fuel) {
        const fuels = Array.isArray(fuel) ? fuel : [fuel];
        if (fuels.length > 0 && fuels[0] !== "") {
            conditions.push({ fuel_type: { in: fuels } });
        }
    }

    if (query) {
        conditions.push({
            OR: [
                { title: { contains: query, mode: "insensitive" } },
                { brand: { contains: query, mode: "insensitive" } },
                { model: { contains: query, mode: "insensitive" } },
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
            include: { images: { take: 2 } },
        }),
        prisma.car.count({ where }),
    ]);

    return {
        cars: cars as unknown as CarWithImages[],
        hasMore: skip + cars.length < total,
        total,
    };
}
