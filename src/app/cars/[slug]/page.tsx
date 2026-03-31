import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import prisma from '@/lib/prisma';
import ImageGallery from '@/components/ImageGallery';
import RelatedVehicles from '@/components/RelatedVehicles';
import MobileContactBar from '@/components/MobileContactBar';
import { MapPin, Calendar, Phone, Mail, ShieldCheck } from 'lucide-react';
import carpassImg from '@/assets/carpass.webp';

export async function generateMetadata(
    props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const params = await props.params;
    const car = await prisma.car.findUnique({
        where: { slug: params.slug },
        include: { images: true }
    });

    if (!car) {
        return { title: 'Voertuig Niet Gevonden | BhenAuto' };
    }

    const imageUrl = car.images.length > 0 ? car.images[0].url : '';
    const priceFormatted = `€${car.price.toLocaleString('nl-BE')}`;
    const ogDescription = `${car.brand} ${car.model} · ${car.year} · ${car.mileage.toLocaleString('nl-BE')} km · ${priceFormatted}`;

    return {
        title: `${car.title} | BhenAuto`,
        description: ogDescription,
        openGraph: {
            title: `${car.title} – ${priceFormatted}`,
            description: ogDescription,
            images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: car.title }] : [],
            type: 'website',
            locale: 'nl_BE',
            siteName: 'BhenAuto',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${car.title} – ${priceFormatted}`,
            description: ogDescription,
            images: imageUrl ? [imageUrl] : [],
        },
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

    // JSON-LD Structured Data
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Car',
        name: car.title,
        brand: { '@type': 'Brand', name: car.brand },
        model: car.model,
        vehicleConfiguration: car.transmission,
        modelDate: car.year.toString(),
        mileageFromOdometer: { '@type': 'QuantitativeValue', value: car.mileage, unitCode: 'KMT' },
        color: car.color,
        offers: {
            '@type': 'Offer',
            price: car.price,
            priceCurrency: 'EUR',
            availability: car.sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
        },
        image: car.images.map(img => img.url),
        description: car.description
    };

    // Transmission label
    const transmissionLabel = car.transmission === 'Automatic' ? 'Automatisch' : 'Handgeschakeld';

    return (
        <div className="min-h-screen bg-[#f8f6f6]">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* ── PAGE WRAPPER with top padding for fixed header ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">

                {/* ── BREADCRUMB ── */}
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                    <Link href="/" className="hover:text-[#d91c1c] transition-colors">Home</Link>
                    <span>/</span>
                    <Link href="/inventory" className="hover:text-[#d91c1c] transition-colors">Voorraad</Link>
                    <span>/</span>
                    <span className="text-slate-600">{car.title}</span>
                </div>

                {/* ── HERO GALLERY ── */}
                <div className="mb-10">
                    <ImageGallery images={car.images} title={car.title} />
                </div>

                {/* ── MAIN CONTENT GRID ── */}
                <div className="flex flex-col lg:flex-row gap-10">

                    {/* ╔═══════════════════════════════╗
                        ║   LEFT — specs & description  ║
                        ╚═══════════════════════════════╝ */}
                    <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-headings font-black text-slate-900 leading-tight mb-2">
                            {car.title}
                        </h1>

                        {/* Subtitle + optional Carpass logo */}
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-slate-500 text-base">
                                {car.brand} · {car.model} · {car.year} · {car.color}
                            </p>
                            {car.carpass_url && (
                                <a
                                    href={car.carpass_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Bekijk Carpass"
                                    className="shrink-0 ml-4 hover:opacity-80 transition-opacity"
                                >
                                    <Image
                                        src={carpassImg}
                                        alt="Carpass"
                                        className="h-10 w-auto object-contain"
                                        priority={false}
                                    />
                                </a>
                            )}
                        </div>

                        {/* Price row */}
                        <div className="flex items-baseline gap-4 mb-10">
                            <span className="text-4xl font-black text-[#d91c1c]">
                                €{car.price.toLocaleString('nl-BE')}
                            </span>
                        </div>

                        {/* ── 4-stat quick bar ── */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border border-slate-200 rounded-xl overflow-hidden mb-10 bg-white shadow-sm">
                            {[
                                { label: 'Kilometerstand', value: `${car.mileage.toLocaleString('nl-BE')} km` },
                                { label: 'Vermogen', value: `${car.horsepower} pk` },
                                { label: 'Brandstof', value: car.fuel_type },
                                { label: 'Transmissie', value: transmissionLabel },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className={`flex flex-col px-5 py-4 ${i < 3 ? 'border-r border-slate-100' : ''}`}
                                >
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                        {item.label}
                                    </span>
                                    <span className="font-bold text-slate-900 text-sm">
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* ── Detailed specifications ── */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-7 mb-8">
                            <h2 className="text-xl font-headings font-black text-slate-900 mb-6">
                                Gedetailleerde Specificaties
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-0">
                                {[
                                    { label: 'Merk', value: car.brand },
                                    { label: 'Exterieurkleur', value: car.color },
                                    { label: 'Brandstoftype', value: car.fuel_type },
                                    { label: 'Transmissie', value: transmissionLabel },
                                    { label: 'Kilometerstand', value: `${car.mileage.toLocaleString('nl-BE')} km` },
                                    { label: 'Bouwjaar', value: car.year },
                                    { label: 'Vermogen', value: `${car.horsepower} pk` },
                                    { label: 'Staat', value: 'Gebruikt' },
                                ].map((row, i) => (
                                    <div key={i} className="flex justify-between items-center py-3.5 border-b border-slate-100 last:border-0">
                                        <span className="text-slate-500 text-sm">{row.label}</span>
                                        <span className="font-semibold text-slate-900 text-sm">{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Description ── */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-7 mb-8">
                            <h2 className="text-xl font-headings font-black text-slate-900 mb-4">
                                Voertuigbeschrijving
                            </h2>
                            <div className="prose prose-slate max-w-none text-slate-500 leading-relaxed text-sm">
                                <p>{car.description}</p>
                            </div>
                        </div>

                        {/* ── Features / Options ── */}
                        {car.features && car.features.length > 0 && (
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-7">
                                <h2 className="text-xl font-headings font-black text-slate-900 mb-5">
                                    Kenmerken & Opties
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {car.features.map((feature: string, idx: number) => (
                                        <span
                                            key={idx}
                                            className="bg-red-50 border border-red-100 text-[#d91c1c] text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm"
                                        >
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ╔═══════════════════════════════╗
                        ║   RIGHT — contact sidebar     ║
                        ╚═══════════════════════════════╝ */}
                    <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 space-y-5">

                        {/* Sticky wrapper */}
                        <div className="lg:sticky lg:top-24 space-y-5">

                            {/* ── Contact Card ── */}
                            <div className="bg-white border border-slate-100 rounded-[28px] shadow-xl shadow-slate-200/40 p-8 relative overflow-hidden group/card transform transition-all duration-500 hover:shadow-2xl">
                                {/* Decorative subtle gradient blob */}
                                <div className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-red-50 to-transparent rounded-full blur-3xl opacity-60 group-hover/card:bg-red-100 transition-colors duration-700 pointer-events-none"></div>

                                <h3 className="text-[32px] font-headings font-black text-slate-900 mb-8 tracking-tight text-left relative z-10">
                                    Interesse?
                                </h3>

                                <div className="space-y-4 mb-8 relative z-10">
                                    {/* Phone Box */}
                                    <a href="tel:+32000000000" className="group flex items-center bg-[#fbfbfb] border border-transparent rounded-[20px] p-5 hover:bg-white hover:border-red-100 transition-all duration-300 hover:shadow-md hover:shadow-red-900/5">
                                        <div className="flex items-center justify-center text-[#d91c1c] mr-5">
                                            <Phone className="w-[22px] h-[22px] transform group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-300" strokeWidth={2.5} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Bel ons direct</p>
                                            <p className="text-lg font-black text-slate-900 tracking-tight group-hover:text-[#d91c1c] transition-colors">+32 (0) 000 00 00</p>
                                        </div>
                                    </a>

                                    {/* Mail Box */}
                                    <Link href={`/contact?car=${car.slug}`} className="group flex items-center bg-[#fbfbfb] border border-transparent rounded-[20px] p-5 hover:bg-white hover:border-red-100 transition-all duration-300 hover:shadow-md hover:shadow-red-900/5">
                                        <div className="flex items-center justify-center text-[#d91c1c] mr-5">
                                            <Mail className="w-[22px] h-[22px] transform group-hover:scale-110 group-hover:translate-y-px transition-transform duration-300" strokeWidth={2.5} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Mail een specialist</p>
                                            <p className="text-[15px] font-bold text-slate-900 tracking-tight group-hover:text-[#d91c1c] transition-colors">sales@bhenauto.nl</p>
                                        </div>
                                    </Link>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-4 mb-8 relative z-10">
                                    <Link
                                        href={`/contact?car=${car.slug}&type=testdrive`}
                                        className="relative flex items-center justify-center w-full py-4.5 bg-[#e61919] hover:bg-[#b91515] active:bg-[#a01010] text-white font-black text-[13px] uppercase tracking-widest rounded-2xl transition-all duration-300 hover:shadow-[0_8px_25px_rgba(230,25,25,0.35)] hover:-translate-y-1 overflow-hidden group"
                                    >
                                        <span className="relative z-10 py-1">BOEK EEN TESTRIT</span>
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-2xl"></div>
                                    </Link>

                                    <Link
                                        href={`/contact?car=${car.slug}`}
                                        className="flex items-center justify-center w-full py-4.5 bg-white border-2 border-slate-200 hover:border-[#d91c1c] text-slate-700 hover:text-[#d91c1c] font-bold text-[15px] transition-all rounded-2xl"
                                    >
                                        Stel een vraag
                                    </Link>

                                </div>

                                {/* Footer of card */}
                                <div className="flex items-center justify-center pt-6 border-t border-slate-100 relative z-10">
                                    <div className="flex items-center gap-2 text-[#008778]">
                                        <ShieldCheck size={18} strokeWidth={2.5} className="mt-[-2px]" />
                                        <span className="text-[11px] font-black uppercase tracking-widest">Inclusief Garantie</span>
                                    </div>
                                </div>
                            </div>

                            {/* ── Location Card Google Maps ── */}
                            <div className="bg-white border border-slate-100 rounded-[28px] shadow-sm overflow-hidden p-3 mt-5">
                                <div className="h-[250px] w-full rounded-[20px] overflow-hidden relative group">
                                    <div className="absolute inset-0 bg-transparent pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] z-10 transition-colors duration-300"></div>
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2516.356948124384!2d4.225758377155591!3d50.89861107168115!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c3c07cb13d10cd%3A0x14ae28aebd5ab2be!2sBhenauto!5e0!3m2!1sen!2sbe!4v1774786991203!5m2!1sen!2sbe"
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        className="grayscale-[20%] contrast-125 transition-all duration-500 group-hover:grayscale-0"
                                    />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* ── RELATED VEHICLES ── */}
                <Suspense fallback={null}>
                    <RelatedVehicles
                        currentCarId={car.id}
                        brand={car.brand}
                        priceRange={car.price}
                    />
                </Suspense>
            </div>

            {/* Sticky Mobile Contact Bar */}
            <MobileContactBar carSlug={car.slug} carTitle={car.title} />

            {/* Bottom padding for mobile sticky bar */}
            <div className="h-20 lg:hidden" />
        </div>
    );
}
