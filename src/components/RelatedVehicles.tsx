import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getImageVariantUrl, shouldUseDirectImageDelivery } from "@/lib/image-url";
import type { CarDetailDict } from "@/lib/dictionaries";
import type { Prisma } from "@/generated/prisma/client";

interface RelatedVehiclesProps {
    currentCarId: string;
    brand: string;
    priceRange: number;
    bodyType?: string | null;
    vehicleType?: string | null;
    fuelType: string;
    transmission: string;
    year: number;
    mileage: number;
    lang: string;
    dict: CarDetailDict;
}

const RELATED_LIMIT = 4;
const CANDIDATE_LIMIT = 48;
const PRICE_MIN_FACTOR = 0.6;
const PRICE_MAX_FACTOR = 1.5;

function sameText(a: string | null | undefined, b: string | null | undefined) {
    return Boolean(a?.trim() && b?.trim() && a.trim().toLowerCase() === b.trim().toLowerCase());
}

function closenessScore(value: number, target: number, maxScore: number, fullPenaltyDelta: number) {
    if (!Number.isFinite(value) || !Number.isFinite(target) || fullPenaltyDelta <= 0) return 0;
    return Math.max(0, maxScore * (1 - Math.abs(value - target) / fullPenaltyDelta));
}

function scoreRelatedCar(car: {
    brand: string;
    price: number;
    bodyType: string | null;
    vehicleType: string | null;
    fuel_type: string;
    transmission: string;
    year: number;
    mileage: number;
}, current: Omit<RelatedVehiclesProps, "currentCarId" | "lang" | "dict">) {
    let score = 0;

    if (sameText(car.brand, current.brand)) score += 45;
    if (sameText(car.vehicleType, current.vehicleType)) score += 30;
    if (sameText(car.bodyType, current.bodyType)) score += 25;
    if (sameText(car.fuel_type, current.fuelType)) score += 12;
    if (sameText(car.transmission, current.transmission)) score += 10;

    score += closenessScore(car.price, current.priceRange, 24, Math.max(current.priceRange, 1));
    score += closenessScore(car.year, current.year, 8, 5);
    score += closenessScore(car.mileage, current.mileage, 6, 80000);

    return score;
}

export default async function RelatedVehicles({
    currentCarId,
    brand,
    priceRange,
    bodyType,
    vehicleType,
    fuelType,
    transmission,
    year,
    mileage,
    lang,
    dict,
}: RelatedVehiclesProps) {
    const priceMin = Math.max(0, priceRange * PRICE_MIN_FACTOR);
    const priceMax = Math.max(priceMin, priceRange * PRICE_MAX_FACTOR);
    const similarityFilters: Prisma.CarWhereInput[] = [
        { brand },
        { price: { gte: priceMin, lte: priceMax } },
        ...(bodyType ? [{ bodyType }] : []),
        ...(vehicleType ? [{ vehicleType }] : []),
        { fuel_type: fuelType },
        { transmission },
    ];

    const candidates = await prisma.car.findMany({
        where: {
            id: { not: currentCarId },
            sold: false,
            OR: similarityFilters,
        },
        take: CANDIDATE_LIMIT,
        orderBy: { createdAt: "desc" },
        include: { images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], take: 1 } },
    });

    let related = candidates
        .map((car) => ({
            car,
            score: scoreRelatedCar(car, { brand, priceRange, bodyType, vehicleType, fuelType, transmission, year, mileage }),
        }))
        .sort((a, b) => b.score - a.score || b.car.createdAt.getTime() - a.car.createdAt.getTime())
        .slice(0, RELATED_LIMIT)
        .map(({ car }) => car);

    if (related.length < RELATED_LIMIT) {
        const fallback = await prisma.car.findMany({
            where: {
                id: { notIn: [currentCarId, ...related.map(c => c.id)] },
                sold: false,
            },
            take: RELATED_LIMIT - related.length,
            orderBy: { createdAt: "desc" },
            include: { images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], take: 1 } },
        });
        related = [...related, ...fallback];
    }

    if (related.length === 0) return null;

    return (
        <section className="mb-8 mt-24 border-t border-[var(--theme-border)] pt-12 sm:mt-32 sm:pt-16">
            <div className="mb-10 flex items-end justify-between">
                <div>
                    <p className="mb-3 text-[9px] font-extrabold uppercase tracking-[0.2em] theme-text-faint">04 / {dict.relatedLabel}</p>
                    <h2 className="font-headings text-4xl font-semibold uppercase leading-none theme-text sm:text-5xl">{dict.relatedTitle}</h2>
                </div>
                <Link
                    href={`/${lang}/inventory`}
                    className="hidden min-h-11 items-center gap-3 border-b border-[var(--theme-border)] text-[10px] font-extrabold uppercase tracking-[0.16em] transition-colors theme-text-muted hover:border-[#d91c1c] hover:text-[#d91c1c] sm:flex"
                >
                    {dict.relatedViewAll}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((car) => {
                    const imgUrl = car.images[0]?.url ? getImageVariantUrl(car.images[0].url, "thumb") : null;
                    return (
                        <Link
                            key={car.id}
                            href={`/${lang}/cars/${car.slug}`}
                            prefetch={false}
                            className="group overflow-hidden border border-[var(--theme-border)] bg-transparent transition-colors duration-200 hover:border-[#8f8a83]"
                        >
                            <div className="relative aspect-[16/10] overflow-hidden" style={{ backgroundColor: 'var(--theme-skeleton)' }}>
                                {imgUrl && (
                                <Image
                                    src={imgUrl}
                                    alt={car.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                    quality={80}
                                    unoptimized={shouldUseDirectImageDelivery(imgUrl)}
                                />
                                )}
                                {car.reserved && (
                                    <div className="absolute right-3 top-3 border border-amber-200/50 bg-white/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                                        {dict.relatedReserved}
                                    </div>
                                )}
                            </div>
                            <div className="p-5">
                                <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.18em] theme-text-faint">{car.brand} / {car.year}</p>
                                <h3 className="mb-5 truncate font-headings text-2xl font-semibold uppercase leading-none transition-colors theme-text group-hover:text-[#d91c1c]">{car.model}</h3>
                                <div className="flex items-end justify-between border-t border-[var(--theme-border)] pt-4">
                                    <span className="font-headings text-2xl font-bold tabular-nums text-[#d91c1c]">€{car.price.toLocaleString("nl-BE")}</span>
                                    <span className="text-right text-[10px] font-semibold leading-4 theme-text-faint">
                                        {car.mileage.toLocaleString("nl-BE")} km
                                    </span>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
