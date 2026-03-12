import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import ImageGallery from '@/components/ImageGallery';
import { MapPin, Calendar, Phone } from 'lucide-react';

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

    return {
        title: `${car.title} | BhenAuto`,
        description: car.description.substring(0, 160),
        openGraph: {
            title: `${car.title} | BhenAuto`,
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

                        {/* Availability badge */}
                        <div className="text-[11px] font-black text-[#d91c1c] uppercase tracking-[0.18em] mb-3">
                            {car.sold ? '⚪ Verkocht' : '🟢 Nu Beschikbaar'}
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-headings font-black text-slate-900 leading-tight mb-2">
                            {car.title}
                        </h1>

                        {/* Subtitle */}
                        <p className="text-slate-500 text-base mb-6">
                            {car.brand} · {car.model} · {car.year} · {car.color}
                        </p>

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
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-7">
                            <h2 className="text-xl font-headings font-black text-slate-900 mb-5">
                                Kenmerken & Opties
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    'Panoramisch Dak',
                                    '360° Camera',
                                    'Stoelverwarming',
                                    'Spoorassistent',
                                    'Apple CarPlay',
                                    'Android Auto',
                                    'Matrix LED Koplampen',
                                    'Keyless Entry',
                                    'Adaptieve Cruisecontrol',
                                    'Dodehoekdetectie',
                                ].map((feature, idx) => (
                                    <span
                                        key={idx}
                                        className="bg-red-50 border border-red-100 text-[#d91c1c] text-xs font-semibold px-3 py-1.5 rounded-lg"
                                    >
                                        {feature}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ╔═══════════════════════════════╗
                        ║   RIGHT — contact sidebar     ║
                        ╚═══════════════════════════════╝ */}
                    <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 space-y-5">

                        {/* Sticky wrapper */}
                        <div className="lg:sticky lg:top-24 space-y-5">

                            {/* ── Contact Card ── */}
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-7">

                                {/* Consultant */}
                                <div className="flex items-center gap-4 mb-7 pb-6 border-b border-slate-100">
                                    <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden shrink-0 relative">
                                        <Image
                                            src="https://i.pravatar.cc/150?u=bhenauto-consultant"
                                            alt="Consultant"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">Rachid Benhammida</h4>
                                        <p className="text-xs text-slate-500">Senior Verkoopadviseur</p>
                                    </div>
                                </div>

                                {/* CTA Buttons */}
                                <div className="flex flex-col gap-3">
                                    <Link
                                        href={`/contact?car=${car.slug}`}
                                        id="btn-request-info"
                                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#d91c1c] hover:bg-[#b91515] active:bg-[#a01010] text-white font-bold text-sm transition-colors rounded-lg"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Informatie Aanvragen
                                    </Link>

                                    <Link
                                        href={`/contact?car=${car.slug}&type=testdrive`}
                                        id="btn-test-drive"
                                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-sm transition-colors rounded-lg border border-slate-200"
                                    >
                                        <Calendar size={16} />
                                        Proefrit Plannen
                                    </Link>

                                    <a
                                        href={`https://wa.me/32000000000?text=Hallo, ik heb interesse in: ${encodeURIComponent(car.title)} (${car.slug})`}
                                        id="btn-whatsapp"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm transition-colors rounded-lg"
                                    >
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zM12 4C7.589 4 4 7.589 4 12c0 1.742.558 3.354 1.5 4.685L4.5 21l4.473-.952A7.957 7.957 0 0012 20c4.411 0 8-3.589 8-8s-3.589-8-8-8z" />
                                        </svg>
                                        Chat via WhatsApp
                                    </a>
                                </div>

                                {/* Direct contact phone */}
                                <div className="mt-7 pt-6 border-t border-slate-100 text-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Direct Contact</span>
                                    <a
                                        href="tel:+32000000000"
                                        className="flex items-center justify-center gap-2 mt-2 text-xl font-black text-slate-900 hover:text-[#d91c1c] transition-colors"
                                    >
                                        <Phone size={18} className="text-[#d91c1c]" />
                                        +32 (0) 000 00 00
                                    </a>
                                </div>
                            </div>

                            {/* ── Location Card ── */}
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                <div className="p-4 flex items-center gap-3 border-b border-slate-100">
                                    <MapPin size={18} className="text-[#d91c1c] shrink-0" />
                                    <span className="font-bold text-slate-900 text-sm">BhenAuto Showroom</span>
                                </div>
                                <div className="h-44 bg-slate-200 relative">
                                    <Image
                                        src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop"
                                        alt="Locatie kaart"
                                        fill
                                        className="object-cover opacity-60"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <a
                                            href="https://maps.google.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-white text-slate-900 px-5 py-2.5 text-xs font-bold rounded-lg shadow-lg uppercase tracking-wider hover:bg-slate-50 transition-colors"
                                        >
                                            Route Plannen
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* ── Financing teaser ── */}
                            <div className="bg-slate-900 text-white rounded-xl p-6">
                                <h3 className="font-headings font-black text-lg mb-2">Financiering Nodig?</h3>
                                <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                                    Vraag een gepersonaliseerde financieringsoplossing aan. Snelle goedkeuring.
                                </p>
                                <Link
                                    href={`/contact?car=${car.slug}&type=financing`}
                                    className="inline-block bg-[#d91c1c] hover:bg-[#b91515] text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors"
                                >
                                    Financiering Aanvragen
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
