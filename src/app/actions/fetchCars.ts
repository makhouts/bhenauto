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
}

export async function fetchCarsPaginated(params: FetchCarsParams): Promise<{
    cars: CarWithImages[];
    hasMore: boolean;
    total: number;
}> {
    const { page = 1, pageSize = 9, brand, query, sort, type } = params;

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
        cars: cars as CarWithImages[],
        hasMore: skip + cars.length < total,
        total,
    };
}
