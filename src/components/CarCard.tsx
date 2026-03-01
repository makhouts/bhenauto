import Image from "next/image";
import Link from "next/link";
import { type Car } from "@prisma/client";

interface CarWithImage extends Car {
    images: { url: string }[];
}

interface CarCardProps {
    car: CarWithImage;
}

export default function CarCard({ car }: CarCardProps) {
    // Use first image if available, else placeholder
    const imageUrl = car.images.length > 0
        ? car.images[0].url
        : "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2070&auto=format&fit=crop";

    return (
        <div className="group flex flex-col bg-white border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-xl rounded-xl">
            <Link href={`/cars/${car.slug}`} className="relative h-56 md:h-64 w-full overflow-hidden block">
                <Image
                    src={imageUrl}
                    alt={car.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                />
                {car.sold && (
                    <div className="absolute top-4 right-4 bg-[#d91c1c] text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                        Verkocht
                    </div>
                )}
            </Link>

            <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <Link href={`/cars/${car.slug}`}>
                        <h3 className="text-xl font-headings font-bold text-slate-900 group-hover:text-[#d91c1c] transition-colors">{car.title}</h3>
                    </Link>
                    <div className="text-lg font-black text-[#d91c1c] shrink-0">
                        ${car.price.toLocaleString()}
                    </div>
                </div>

                <div className="text-sm text-slate-500 mb-6 flex-grow">
                    {car.brand} • {car.model}
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-slate-600 pt-4 border-t border-slate-100">
                    <div className="flex flex-col">
                        <span className="uppercase text-[10px] tracking-wider text-slate-400 font-bold mb-0.5">Kilometerstand</span>
                        <span className="font-semibold">{car.mileage.toLocaleString()} km</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="uppercase text-[10px] tracking-wider text-slate-400 font-bold mb-0.5">Bouwjaar</span>
                        <span className="font-semibold">{car.year}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="uppercase text-[10px] tracking-wider text-slate-400 font-bold mb-0.5">Transmissie</span>
                        <span className="font-semibold">{car.transmission}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="uppercase text-[10px] tracking-wider text-slate-400 font-bold mb-0.5">Vermogen (PK)</span>
                        <span className="font-semibold">{car.horsepower}</span>
                    </div>
                </div>

                <Link
                    href={`/cars/${car.slug}`}
                    className="mt-6 w-full py-3 bg-[#d91c1c] text-white text-center uppercase tracking-widest text-xs font-bold hover:bg-[#b91515] transition-all rounded-lg shadow-md shadow-[#d91c1c]/20"
                >
                    Bekijk Details
                </Link>
            </div>
        </div>
    );
}
