import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense, cache } from 'react';
import prisma from '@/lib/prisma';
import ImageGallery from '@/components/ImageGallery';
import RelatedVehicles from '@/components/RelatedVehicles';
import MobileContactBar from '@/components/MobileContactBar';
import ExpandableDescription from '@/components/ExpandableDescription';
import { getImageVariantUrl } from '@/lib/image-url';
import { ShieldCheck } from 'lucide-react';
import CarContactPanel from '@/components/CarContactPanel';
import CarWhatsAppButton from '@/components/CarWhatsAppButton';
import DeferredMap from '@/components/DeferredMap';
import carpassImg from '@/assets/carpass.webp';
import { getDictionary } from '@/lib/dictionaries';
import { isValidLocale, type Locale } from '@/lib/i18n';

// Deduplicate the car query between generateMetadata and the page component
const getCar = cache(async (slug: string) => {
    return prisma.car.findUnique({
        where: { slug },
        include: { images: { orderBy: { createdAt: 'asc' } } },
    });
});

// ISR: car data changes when admin edits — revalidatePath is called on mutations
export const revalidate = 60;

export async function generateMetadata(
    props: { params: Promise<{ lang: string; slug: string }> }
): Promise<Metadata> {
    const params = await props.params;
    const car = await getCar(params.slug);

    if (!car) {
        return { title: 'Voertuig Niet Gevonden | BhenAuto' };
    }

    const imageUrl = car.images.length > 0 ? getImageVariantUrl(car.images[0].url, 'gallery') : '';
    const priceFormatted = `€${car.price.toLocaleString('nl-BE')}`;
    const ogDescription = `${car.brand} ${car.model} · ${car.year} · ${car.mileage.toLocaleString('nl-BE')} km · ${priceFormatted}`;

    const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bhenauto.com';
    const ogLocales: Record<string, string> = { nl: 'nl_BE', fr: 'fr_BE', en: 'en_GB' };

    return {
        title: `${car.title} | BhenAuto`,
        description: ogDescription,
        metadataBase: new URL(BASE_URL),
        alternates: {
            canonical: `${BASE_URL}/${params.lang}/cars/${car.slug}`,
            languages: {
                nl: `${BASE_URL}/nl/cars/${car.slug}`,
                fr: `${BASE_URL}/fr/cars/${car.slug}`,
                en: `${BASE_URL}/en/cars/${car.slug}`,
            },
        },
        openGraph: {
            title: `${car.title} – ${priceFormatted}`,
            description: ogDescription,
            images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: car.title }] : [],
            type: 'website',
            locale: ogLocales[params.lang] || 'fr_BE',
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
    props: { params: Promise<{ lang: string; slug: string }> }
) {
    const params = await props.params;
    const { lang } = params;
    const car = await getCar(params.slug);

    if (!car) {
        notFound();
    }

    const locale: Locale = isValidLocale(lang) ? lang : 'nl';
    const dict = await getDictionary(locale);
    const t = dict.carDetail;

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
        fuelType: car.fuel_type,
        vehicleEngine: {
            '@type': 'EngineSpecification',
            enginePower: {
                '@type': 'QuantitativeValue',
                value: car.horsepower,
                unitCode: 'BHP',
            },
        },
        color: car.color,
        offers: {
            '@type': 'Offer',
            price: car.price,
            priceCurrency: 'EUR',
            availability: car.sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
        },
        image: car.images.map((img: { url: string }) => getImageVariantUrl(img.url, 'gallery')),
        description: car.description
    };

    // Transmission label
    const transmissionLabel = car.transmission === 'Automatic' ? t.transmissionAuto : t.transmissionManual;

    // WhatsApp — include lang in the shared URL so the link resolves correctly
    const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bhenauto.com';
    const carUrl = `${BASE_URL}/${lang}/cars/${car.slug}`;
    const whatsappText = t.whatsappMessage.replace('{title}', car.title);
    const whatsappMsg = encodeURIComponent(`${whatsappText}\n${carUrl}`);
    const whatsappUrl = `https://wa.me/32477544294?text=${whatsappMsg}`;

    return (
        <div className="min-h-screen theme-bg">
            <script
                type="application/ld+json"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/<\//g, '<\\/') }}
            />

            {/* ── PAGE WRAPPER with top padding for fixed header ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 md:pt-24 pb-20">

                {/* ── BREADCRUMB ── */}
                <div className="flex items-center gap-2 text-[11px] font-bold theme-text-faint uppercase tracking-widest mb-6">
                    <Link href={`/${lang}`} className="hover:text-[#d91c1c] transition-colors">Home</Link>
                    <span>/</span>
                    <Link href={`/${lang}/inventory`} className="hover:text-[#d91c1c] transition-colors">{t.breadcrumbStock}</Link>
                    <span>/</span>
                    <span className="theme-text-secondary">{car.brand} {car.model}</span>
                </div>

                {/* ── SOLD BANNER ── */}
                {car.sold && (
                    <div
                        className="mb-8 flex items-center gap-4 px-6 py-5 rounded-2xl"
                        style={{
                            background: "#0f0f0f",
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: "rgba(255,255,255,0.06)" }}
                        >
                            <ShieldCheck className="w-5 h-5 text-slate-300" />
                        </div>
                        <div>
                            <p className="text-white font-black text-sm uppercase tracking-[0.18em] mb-0.5">{t.soldBannerTitle}</p>
                            <p className="text-slate-400 text-[13px] leading-snug">
                                {t.soldBannerBody}
                            </p>
                        </div>
                        <Link
                            href={`/${lang}/inventory`}
                            className="ml-auto shrink-0 px-4 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/10"
                            style={{ border: "1px solid rgba(255,255,255,0.15)" }}
                        >
                            {t.soldBannerCta}
                        </Link>
                    </div>
                )}

                {/* ── VEHICLE HEADING ── */}
                <div className="mb-5" aria-label={`${car.brand} ${car.model}`}>
                    <p className="text-3xl md:text-4xl font-headings font-black theme-text leading-tight break-words">
                        {car.brand} {car.model}
                    </p>
                </div>

                {/* ── HERO GALLERY ── */}
                <div className="relative mb-10">
                    <ImageGallery images={car.images} title={car.title} />
                    {car.sold && (
                        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.18em]"
                            style={{ background: "rgba(255, 0, 0, 0.82)", color: "#f1f5f9", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(8px)" }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            {t.soldOverlayLabel}
                        </div>
                    )}
                </div>

                {/* ── MAIN CONTENT GRID ── */}
                <div className="flex flex-col lg:flex-row gap-10">

                    {/* ╔═══════════════════════════════╗
                        ║   LEFT — specs & description  ║
                        ╚═══════════════════════════════╝ */}
                    <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h1 className="text-[17px] font-headings font-black theme-text leading-snug mb-3 break-words">
                            {car.title}
                        </h1>

                        {/* Vehicle meta + optional Carpass logo */}
                        <div className="flex items-center justify-between mb-6">
                            <p className="theme-text-muted text-base">
                                {car.year} · {car.color} · {transmissionLabel}
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
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 rounded-xl overflow-hidden mb-10 theme-surface shadow-sm" style={{ border: '1px solid var(--theme-border)' }}>
                            {[
                                { label: t.statMileage, value: `${car.mileage.toLocaleString('nl-BE')} km` },
                                { label: t.statPower, value: `${car.horsepower} pk` },
                                { label: t.statFuel, value: car.fuel_type },
                                { label: t.statTransmission, value: transmissionLabel },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className={`flex flex-col px-5 py-4 ${i < 3 ? 'border-r' : ''}`}
                                    style={i < 3 ? { borderColor: 'var(--theme-border-subtle)' } : {}}
                                >
                                    <span className="text-[10px] font-bold theme-text-faint uppercase tracking-widest mb-1">
                                        {item.label}
                                    </span>
                                    <span className="font-bold theme-text text-sm">
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* ── Detailed specifications ── */}
                        <div className="theme-surface rounded-xl shadow-sm p-7 mb-8" style={{ border: '1px solid var(--theme-border)' }}>
                            <h2 className="text-xl font-headings font-black theme-text mb-6">
                                {t.specsTitle}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-0">
                                {[
                                    { label: t.specBrand, value: car.brand },
                                    { label: t.specColor, value: car.color },
                                    { label: t.specFuel, value: car.fuel_type },
                                    { label: t.specTransmission, value: transmissionLabel },
                                    { label: t.specMileage, value: `${car.mileage.toLocaleString('nl-BE')} km` },
                                    { label: t.specYear, value: car.year },
                                    { label: t.specPower, value: `${car.horsepower} pk` },
                                    { label: t.specCondition, value: t.specConditionValue },
                                ].map((row, i) => (
                                    <div key={i} className="flex justify-between items-center py-3.5 last:border-0" style={{ borderBottom: '1px solid var(--theme-border-subtle)' }}>
                                        <span className="theme-text-muted text-sm">{row.label}</span>
                                        <span className="font-semibold theme-text text-sm">{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Description ── */}
                        <div className="theme-surface rounded-xl shadow-sm p-7 mb-8" style={{ border: '1px solid var(--theme-border)' }}>
                            <h2 className="text-xl font-headings font-black theme-text mb-4">
                                {t.descriptionTitle}
                            </h2>
                            <ExpandableDescription description={car.description} />
                        </div>

                        {/* ── Features / Options ── */}
                        {car.features && car.features.length > 0 && (
                            <div className="theme-surface rounded-xl shadow-sm p-7" style={{ border: '1px solid var(--theme-border)' }}>
                                <h2 className="text-xl font-headings font-black theme-text mb-5">
                                    {t.featuresTitle}
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {car.features.map((feature: string, idx: number) => (
                                        <span
                                            key={idx}
                                            className="text-[#d91c1c] text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm"
                                            style={{ backgroundColor: 'var(--theme-icon-bg)', border: '1px solid rgba(217,28,28,0.2)' }}
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
                            <CarContactPanel
                                lang={lang}
                                carSlug={car.slug}
                                carTitle={car.title}
                                whatsappUrl={whatsappUrl}
                                sold={car.sold ?? false}
                                dict={dict.carDetail}
                                securityError={dict.errors.turnstileFailed}
                            />

                            {/* ── Location Card Google Maps ── */}
                            <div className="hidden lg:block theme-surface rounded-[28px] shadow-sm overflow-hidden p-3 mt-5" style={{ border: '1px solid var(--theme-border)' }}>
                                <div className="h-[250px] w-full rounded-[20px] overflow-hidden relative group">
                                    <div className="absolute inset-0 bg-transparent pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] z-10 transition-colors duration-300"></div>
                                    <DeferredMap />
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
                        lang={lang}
                        dict={dict.carDetail}
                    />
                </Suspense>
            </div>

            {/* Sticky Mobile Contact Bar */}
            <MobileContactBar
                carSlug={car.slug}
                locale={lang}
                dict={dict.carDetail}
                whatsappUrl={whatsappUrl}
            />

            {/* Bottom padding for mobile sticky bar */}
            <div className="h-20 lg:hidden" />

            {/* Car-specific floating WhatsApp button (desktop only) */}
            <CarWhatsAppButton whatsappUrl={whatsappUrl} label={t.contactWhatsApp} />
        </div>
    );
}
