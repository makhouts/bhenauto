import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import ImageGallery from '@/components/ImageGallery';
import { Shield, Settings, Calendar, Navigation, Route, Fuel, Power, Palette } from 'lucide-react';

export async function generateMetadata(
    props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const params = await props.params;
    const car = await prisma.car.findUnique({
        where: { slug: params.slug },
        include: { images: true }
    });

    if (!car) {
        return { title: 'Car Not Found | bhenauto' };
    }

    const imageUrl = car.images.length > 0 ? car.images[0].url : '';

    return {
        title: `${car.title} | bhenauto`,
        description: car.description.substring(0, 160),
        openGraph: {
            title: `${car.title} | bhenauto`,
            description: car.description.substring(0, 160),
            images: imageUrl ? [{ url: imageUrl }] : [],
        }
    };
}

export default async function CarDetailPage(
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    const car = await prisma.car.findUnique({
        where: { slug: params.slug },
        include: { images: true }
    });

    if (!car) {
        notFound();
    }

    // Generate Vehicle JSON-LD
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Car',
        name: car.title,
        brand: {
            '@type': 'Brand',
            name: car.brand
        },
        model: car.model,
        vehicleConfiguration: car.transmission,
        modelDate: car.year.toString(),
        mileageFromOdometer: {
            '@type': 'QuantitativeValue',
            value: car.mileage,
            unitCode: 'SMI' // Miles
        },
        color: car.color,
        offers: {
            '@type': 'Offer',
            price: car.price,
            priceCurrency: 'USD',
            availability: car.sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
        },
        image: car.images.map(img => img.url),
        description: car.description
    };

    const specs = [
        { label: "Year", value: car.year, icon: Calendar },
        { label: "Mileage", value: `${car.mileage.toLocaleString()} mi`, icon: Route },
        { label: "Transmission", value: car.transmission, icon: Settings },
        { label: "Fuel Type", value: car.fuel_type, icon: Fuel },
        { label: "Horsepower", value: `${car.horsepower} hp`, icon: Power },
        { label: "Exterior Color", value: car.color, icon: Palette },
    ];

    return (
        <div className="min-h-screen bg-background-light">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Top Banner Area */}
            <div className="bg-white py-6 border-b border-slate-200 mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-end">
                    <div>
                        <div className="flex items-center text-sm text-[#d91c1c] uppercase tracking-widest font-bold mb-2">
                            <span>{car.brand}</span>
                            <span className="mx-2 text-slate-300">•</span>
                            <span>{car.year}</span>
                            {car.sold && (
                                <>
                                    <span className="mx-2 text-slate-300">•</span>
                                    <span className="bg-[#d91c1c] text-white px-2 py-0.5 rounded-full text-xs">SOLD</span>
                                </>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-headings font-black text-slate-900 mb-2">{car.title}</h1>
                    </div>
                    <div className="mt-4 md:mt-0 text-3xl font-black font-headings text-[#d91c1c]">
                        ${car.price.toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Main Content: Gallery & Description */}
                    <div className="lg:col-span-2 space-y-12">
                        <ImageGallery images={car.images} title={car.title} />

                        <section className="bg-white p-8 border border-slate-200 rounded-2xl shadow-sm">
                            <h2 className="text-2xl font-headings text-slate-900 mb-6 uppercase tracking-wider relative inline-block font-bold">
                                Vehicle Overview
                                <div className="absolute -bottom-2 left-0 w-1/2 h-1 bg-[#d91c1c] rounded-full"></div>
                            </h2>
                            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-medium">
                                <p>{car.description}</p>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar: Specs & CTA */}
                    <div className="space-y-8">
                        {/* Quick Actions Component */}
                        <div className="bg-white p-8 border border-slate-200 shadow-xl rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#d91c1c]/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                            <h3 className="text-xl font-headings text-slate-900 mb-6 uppercase tracking-wide font-bold">Interested?</h3>

                            <Link
                                href={`/contact?car=${car.slug}`}
                                className="block w-full py-4 text-center bg-[#d91c1c] hover:bg-[#b91515] text-white uppercase tracking-widest text-sm font-bold transition-all shadow-md shadow-[#d91c1c]/20 rounded-lg mb-4"
                            >
                                Request Information
                            </Link>

                            <div className="flex items-center justify-center text-sm text-slate-500 font-medium mt-6 pt-6 border-t border-slate-100">
                                <Shield size={16} className="mr-2 text-[#d91c1c]" />
                                <span>Certified Inspection Included</span>
                            </div>
                        </div>

                        {/* Specifications Details */}
                        <div className="bg-white p-8 border border-slate-200 rounded-2xl shadow-sm">
                            <h3 className="text-xl font-headings text-slate-900 mb-6 uppercase tracking-wide relative inline-block font-bold">
                                Specifications
                                <div className="absolute -bottom-2 left-0 w-1/3 h-1 bg-[#d91c1c] rounded-full"></div>
                            </h3>

                            <ul className="space-y-6">
                                {specs.map((spec, index) => (
                                    <li key={index} className="flex items-start">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mr-4 shrink-0 border border-slate-100">
                                            <spec.icon size={18} className="text-[#d91c1c]" />
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">{spec.label}</div>
                                            <div className="text-slate-900 font-semibold">{spec.value}</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
