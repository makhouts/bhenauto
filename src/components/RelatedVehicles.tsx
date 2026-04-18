import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getImageUrl } from "@/lib/image-url";
import type { CarDetailDict } from "@/lib/dictionaries";

interface RelatedVehiclesProps {
    currentCarId: string;
    brand: string;
    priceRange: number;
    lang: string;
    dict: CarDetailDict;
}

export default async function RelatedVehicles({ currentCarId, brand, priceRange, lang, dict }: RelatedVehiclesProps) {
    // Find cars from the same brand first, then fill with similar price range
    const sameBrand = await prisma.car.findMany({
        where: {
            id: { not: currentCarId },
            brand: brand,
            sold: false,
        },
        take: 4,
        orderBy: { createdAt: "desc" },
        include: { images: { take: 1 } },
    });

    let related = [...sameBrand];

    // If not enough from same brand, fill with similar price range
    if (related.length < 4) {
        const similarPrice = await prisma.car.findMany({
            where: {
                id: { notIn: [currentCarId, ...related.map(c => c.id)] },
                sold: false,
                price: {
                    gte: priceRange * 0.6,
                    lte: priceRange * 1.5,
                },
            },
            take: 4 - related.length,
            orderBy: { createdAt: "desc" },
            include: { images: { take: 1 } },
        });
        related = [...related, ...similarPrice];
    }

    if (related.length === 0) return null;

    return (
        <section className="mt-16 mb-8">
            <div className="flex items-baseline justify-between mb-8">
                <div>
                    <p className="text-[10px] font-bold theme-text-faint uppercase tracking-widest mb-1">{dict.relatedLabel}</p>
                    <h2 className="text-2xl md:text-3xl font-headings font-black theme-text">{dict.relatedTitle}</h2>
                </div>
                <Link
                    href={`/${lang}/inventory`}
                    className="hidden sm:flex items-center gap-2 text-sm font-bold theme-text-muted hover:text-[#d91c1c] transition-colors"
                >
                    {dict.relatedViewAll}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {related.map((car) => {
                    const imgUrl = car.images[0]?.url ? getImageUrl(car.images[0].url) : "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2070&auto=format&fit=crop";
                    return (
                        <Link
                            key={car.id}
                            href={`/${lang}/cars/${car.slug}`}
                            className="group theme-surface rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                            style={{ border: '1px solid var(--theme-border)' }}
                        >
                            <div className="relative h-[180px] overflow-hidden" style={{ backgroundColor: 'var(--theme-skeleton)' }}>
                                <Image
                                    src={imgUrl}
                                    alt={car.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                />
                                {car.reserved && (
                                    <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-md text-amber-600 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-200/50">
                                        {dict.relatedReserved}
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <p className="text-[10px] font-bold theme-text-faint uppercase tracking-widest mb-0.5">{car.brand}</p>
                                <h3 className="text-base font-headings font-bold theme-text truncate mb-1 group-hover:text-[#d91c1c] transition-colors">{car.model}</h3>
                                <div className="flex items-baseline justify-between">
                                    <span className="text-lg font-black text-[#d91c1c]">€{car.price.toLocaleString("nl-BE")}</span>
                                    <span className="text-[11px] theme-text-faint font-medium">
                                        {car.year} · {car.mileage.toLocaleString("nl-BE")} km
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
