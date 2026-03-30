"use server";

import prisma from "@/lib/prisma";

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

    const where: any = {};

    if (brand) {
        if (Array.isArray(brand)) {
            where.brand = { in: brand };
        } else {
            where.brand = brand;
        }
    }

    if (type) {
        const types = Array.isArray(type) ? type : [type];
        where.OR = types.flatMap((t: string) => [
            { model: { contains: t } },
            { description: { contains: t } }
        ]);
    }

    if (maxPrice) {
        const parsedPrice = parseInt(maxPrice, 10);
        if (!isNaN(parsedPrice) && parsedPrice < 250000) {
            where.price = { lte: parsedPrice };
        }
    }

    if (maxMileage) {
        const parsedMileage = parseInt(maxMileage, 10);
        if (!isNaN(parsedMileage) && parsedMileage < 200000) {
            where.mileage = { lte: parsedMileage };
        }
    }

    if (fuel) {
        const fuels = Array.isArray(fuel) ? fuel : [fuel];
        if (fuels.length > 0 && fuels[0] !== "") {
            where.fuel_type = { in: fuels };
        }
    }

    if (query) {
        const queryOr = [
            { title: { contains: query } },
            { brand: { contains: query } },
            { model: { contains: query } }
        ];
        if (where.OR) {
            where.AND = [{ OR: where.OR }, { OR: queryOr }];
            delete where.OR;
        } else {
            where.OR = queryOr;
        }
    }

    const orderBy: any = {};
    if (sort === "price_asc") orderBy.price = "asc";
    else if (sort === "price_desc") orderBy.price = "desc";
    else if (sort === "year_desc") orderBy.year = "desc";
    else if (sort === "mileage_asc") orderBy.mileage = "asc";
    else orderBy.createdAt = "desc";

    const skip = (page - 1) * pageSize;

    const [cars, total] = await Promise.all([
        prisma.car.findMany({
            where,
            orderBy,
            skip,
            take: pageSize,
            include: { images: { take: 2 } }, // Only need first 2 images for the card
        }),
        prisma.car.count({ where }),
    ]);

    return {
        cars: cars as unknown as CarWithImages[],
        hasMore: skip + cars.length < total,
        total,
    };
}
