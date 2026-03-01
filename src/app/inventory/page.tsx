import { Suspense } from "react";
import prisma from "@/lib/prisma";
import CarCard from "@/components/CarCard";
import InventoryFilter from "@/components/InventoryFilter";

export const metadata = {
    title: "Inventory | bhenauto",
    description: "Browse our exclusive collection of luxury and premium secondhand vehicles.",
};

export default async function InventoryPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams;

    // Build Prisma query from search params
    const query = searchParams.query as string | undefined;
    const brand = searchParams.brand as string | undefined;
    const sort = searchParams.sort as string | undefined;
    const type = searchParams.type as string | undefined; // from footer links

    const where: any = {};

    if (brand) {
        where.brand = brand;
    }

    if (type) {
        // Simple basic keyword matching for the demo
        where.OR = [
            { model: { contains: type } },
            { description: { contains: type } }
        ];
    }

    if (query) {
        where.OR = where.OR || [];
        where.OR.push(
            { title: { contains: query } },
            { brand: { contains: query } },
            { model: { contains: query } }
        );
    }

    // Handle sorting
    const orderBy: any = {};
    if (sort === "price_asc") {
        orderBy.price = "asc";
    } else if (sort === "price_desc") {
        orderBy.price = "desc";
    } else if (sort === "year_desc") {
        orderBy.year = "desc";
    } else if (sort === "mileage_asc") {
        orderBy.mileage = "asc";
    } else {
        // Default sorting
        orderBy.createdAt = "desc";
    }

    // Fetch cars from DB
    const cars = await prisma.car.findMany({
        where,
        orderBy,
        include: {
            images: true,
        },
    });

    return (
        <div className="min-h-screen bg-background-light flex flex-col pt-8">
            {/* Header Banner */}
            <div className="bg-white py-16 border-b border-slate-200 text-center">
                <div className="max-w-4xl mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-headings font-black text-slate-900 mb-4">Our Collection</h1>
                    <p className="text-slate-600 font-medium max-w-2xl mx-auto">
                        Explore our meticulously curated inventory of the world's finest vehicles.
                        Each motorcar is certified to meet our exacting standards.
                    </p>
                </div>
            </div>

            {/* Filter Bar with Suspense for useSearchParams */}
            <Suspense fallback={<div className="h-20 bg-white border-b border-slate-200" />}>
                <InventoryFilter />
            </Suspense>

            {/* Inventory Grid */}
            <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {cars.length === 0 ? (
                    <div className="text-center py-24 flex flex-col items-center">
                        <h3 className="text-2xl font-headings font-bold text-slate-900 mb-2">No Vehicles Found</h3>
                        <p className="text-slate-500 mb-8 font-medium">We currently don't have vehicles matching your specific criteria.</p>
                        <button
                            className="px-6 py-3 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors uppercase tracking-widest text-sm font-bold shadow-sm"
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {cars.map((car) => (
                            <CarCard key={car.id} car={car} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
