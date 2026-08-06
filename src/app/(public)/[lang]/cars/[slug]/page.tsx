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
import ExpandableFeatures from '@/components/ExpandableFeatures';
import { getImageVariantUrl } from '@/lib/image-url';
import { ShieldCheck } from 'lucide-react';
import CarContactPanel from '@/components/CarContactPanel';
import CarWhatsAppButton from '@/components/CarWhatsAppButton';
import DeferredMap from '@/components/DeferredMap';
import CarDetailAnalyticsTracker from '@/components/analytics/CarDetailAnalyticsTracker';
import carpassImg from '@/assets/carpass.webp';
import { getDictionary } from '@/lib/dictionaries';
import { isValidLocale, type Locale } from '@/lib/i18n';
import { getTranslatedEquipmentOptions } from '@/lib/autoscout24/translated-options';
import { localizeCarForPublic } from '@/lib/autoscout24/public-presentation';
import { businessJsonLd, jsonLdScriptContent } from '@/lib/business-schema';
import { localizedAlternates, localizedUrl, ogLocales, SITE_URL } from '@/lib/site-seo';

type SeoCarMetadataInput = {
    brand: string;
    model: string;
    year: number;
    mileage: number;
    price: number;
    fuel_type: string;
    transmission: string;
    color: string;
};

const SEO_DESCRIPTION_MAX_LENGTH = 160;

// Deduplicate the car query between generateMetadata and the page component
const getCar = cache(async (slug: string) => {
    return prisma.car.findUnique({
        where: { slug },
        include: { images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } },
    });
});

const getLocalizedCar = cache(async (slug: string, locale: Locale) => {
    const car = await getCar(slug);
    if (!car) return null;

    return localizeCarForPublic(car, locale);
});

function truncateMetaDescription(value: string, maxLength = SEO_DESCRIPTION_MAX_LENGTH) {
    const normalized = value.replace(/\s+/g, ' ').trim();
    if (normalized.length <= maxLength) return normalized;

    const slice = normalized.slice(0, maxLength - 1).trimEnd();
    const safeCutoff = slice.lastIndexOf(' ');
    return `${(safeCutoff > 100 ? slice.slice(0, safeCutoff) : slice).trimEnd()}…`;
}

function buildCarMetaDescription(car: SeoCarMetadataInput, locale: Locale) {
    const mileage = car.mileage.toLocaleString('nl-BE');
    const price = `€${car.price.toLocaleString('nl-BE')}`;

    const descriptions: Record<Locale, string> = {
        nl: `${car.brand} ${car.model} uit ${car.year} met ${mileage} km, ${car.fuel_type}, ${car.transmission} en ${car.color}. Beschikbaar bij BhenAuto voor ${price}.`,
        fr: `${car.brand} ${car.model} de ${car.year} avec ${mileage} km, ${car.fuel_type}, ${car.transmission} et ${car.color}. Disponible chez BhenAuto pour ${price}.`,
        en: `${car.brand} ${car.model} from ${car.year} with ${mileage} km, ${car.fuel_type}, ${car.transmission}, and ${car.color}. Available at BhenAuto for ${price}.`,
    };

    return truncateMetaDescription(descriptions[locale]);
}

// ISR: car data changes when admin edits — revalidatePath is called on mutations
export const revalidate = 60;

export async function generateMetadata(
    props: { params: Promise<{ lang: string; slug: string }> }
): Promise<Metadata> {
    const params = await props.params;
    const locale: Locale = isValidLocale(params.lang) ? params.lang : 'fr';
    const car = await getLocalizedCar(params.slug, locale);

    if (!car) {
        return { title: 'Voertuig Niet Gevonden' };
    }

    const imageUrl = car.images.length > 0 ? getImageVariantUrl(car.images[0].url, 'gallery') : '';
    const seoDescription = buildCarMetaDescription(car, locale);
    const carUrl = localizedUrl(locale, `/cars/${car.slug}`);
    const priceFormatted = `€${car.price.toLocaleString('nl-BE')}`;
    const seoTitles: Record<Locale, string> = {
        nl: `${car.brand} ${car.model} ${car.year} te koop`,
        fr: `${car.brand} ${car.model} ${car.year} à vendre`,
        en: `${car.brand} ${car.model} ${car.year} for sale`,
    };
    const seoTitle = seoTitles[locale];

    return {
        title: seoTitle,
        description: seoDescription,
        metadataBase: new URL(SITE_URL),
        alternates: {
            canonical: carUrl,
            languages: localizedAlternates(`/cars/${car.slug}`),
        },
        openGraph: {
            url: carUrl,
            title: `${seoTitle} – ${priceFormatted}`,
            description: seoDescription,
            images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: car.title }] : [],
            type: 'website',
            locale: ogLocales[locale],
            siteName: 'BhenAuto',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${seoTitle} – ${priceFormatted}`,
            description: seoDescription,
            images: imageUrl ? [imageUrl] : [],
        },
    };
}

export default async function CarDetailPage(
    props: { params: Promise<{ lang: string; slug: string }> }
) {
    const params = await props.params;
    const { lang } = params;
    const dbCar = await getCar(params.slug);

    if (!dbCar) {
        notFound();
    }

    const locale: Locale = isValidLocale(lang) ? lang : 'nl';
    const dict = await getDictionary(locale);
    const car = await getLocalizedCar(params.slug, locale);
    if (!car) {
        notFound();
    }
    const t = dict.carDetail;
    const translatedFeatures = await getTranslatedEquipmentOptions(car.equipmentCodes, locale, car.features);
    const carUrl = localizedUrl(locale, `/cars/${car.slug}`);
    const seoDescription = buildCarMetaDescription(car, locale);
    const businessSchemaNode = Object.fromEntries(
        Object.entries(businessJsonLd).filter(([key]) => key !== '@context')
    );

    const carJsonLd = {
        '@type': 'Car',
        '@id': `${carUrl}#vehicle`,
        name: car.title,
        url: carUrl,
        mainEntityOfPage: carUrl,
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
            url: carUrl,
            price: car.price,
            priceCurrency: 'EUR',
            availability: car.sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/UsedCondition',
            seller: { '@id': businessJsonLd['@id'] },
        },
        image: car.images.map((img: { url: string }) => getImageVariantUrl(img.url, 'gallery')),
        description: seoDescription,
    };

    const breadcrumbJsonLd = {
        '@type': 'BreadcrumbList',
        '@id': `${carUrl}#breadcrumb`,
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: localizedUrl(locale),
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: t.breadcrumbStock,
                item: localizedUrl(locale, '/inventory'),
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: `${car.brand} ${car.model}`,
                item: carUrl,
            },
        ],
    };

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [businessSchemaNode, carJsonLd, breadcrumbJsonLd],
    };

    const transmissionLabel = car.transmission;

    // WhatsApp — include lang in the shared URL so the link resolves correctly
    const whatsappText = t.whatsappMessage.replace('{title}', car.title);
    const whatsappMsg = encodeURIComponent(`${whatsappText}\n${carUrl}`);
    const whatsappUrl = `https://wa.me/32477544294?text=${whatsappMsg}`;

    return (
        <div className="min-h-screen theme-bg">
            <CarDetailAnalyticsTracker carId={car.id} locale={locale} path={`/${locale}/cars/${car.slug}`} />
            <script
                type="application/ld+json"
                suppressHydrationWarning
                dangerouslySetInnerHTML={jsonLdScriptContent(jsonLd)}
            />

            <main>
                <section className="bg-[#111116] text-white">
                    <div className="mx-auto max-w-[1720px] px-4 pb-10 pt-10 sm:px-6 sm:pt-14 md:pt-[130px] lg:px-10 xl:px-12">
                        <nav aria-label="Breadcrumb" className="mb-10 flex flex-wrap items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/45">
                            <Link href={`/${lang}`} className="min-h-11 py-3 transition-colors hover:text-[#d91c1c]">Home</Link>
                            <span className="h-px w-6 bg-[#d91c1c]" />
                            <Link href={`/${lang}/inventory`} className="min-h-11 py-3 transition-colors hover:text-[#d91c1c]">{t.breadcrumbStock}</Link>
                            <span>/</span>
                            <span className="text-white/75">{car.brand} {car.model}</span>
                        </nav>

                        {car.sold && (
                            <div className="mb-10 flex flex-col gap-5 border-y border-white/15 py-5 sm:flex-row sm:items-center">
                                <ShieldCheck className="size-6 shrink-0 text-[#d91c1c]" />
                                <div>
                                    <p className="text-xs font-extrabold uppercase tracking-[0.16em]">{t.soldBannerTitle}</p>
                                    <p className="mt-1 text-sm text-white/55">{t.soldBannerBody}</p>
                                </div>
                                <Link href={`/${lang}/inventory`} className="min-h-11 border border-white/20 px-5 py-3 text-center text-[10px] font-extrabold uppercase tracking-[0.16em] transition-colors hover:bg-white hover:text-[#111116] sm:ml-auto">
                                    {t.soldBannerCta}
                                </Link>
                            </div>
                        )}

                        <div className="mb-9 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
                            <div className="lg:col-span-8">
                                <p className="mb-5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/45">BHEN / {car.year} / {car.brand}</p>
                                <h1 className="max-w-5xl break-words font-headings text-[clamp(3.4rem,7vw,7.5rem)] font-semibold uppercase leading-[0.78] tracking-[-0.04em]">
                                    {car.brand} {car.model}
                                </h1>
                                <p className="mt-6 max-w-3xl text-sm leading-7 text-white/55">{car.title}</p>
                            </div>
                            <div className="border-l border-white/15 pl-0 lg:col-span-4 lg:pl-10">
                                <p className="mb-2 text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/40">EUR</p>
                                <p className="font-headings text-5xl font-semibold leading-none text-[#d91c1c] tabular-nums sm:text-6xl">€{car.price.toLocaleString('nl-BE')}</p>
                                <p className="mt-5 text-sm text-white/55">{car.color} · {transmissionLabel}</p>
                            </div>
                        </div>

                        <div className="relative">
                            <ImageGallery
                                images={car.images}
                                title={car.title}
                                closeLabel={t.galleryClose}
                                zoomInLabel={t.galleryZoomIn}
                                zoomOutLabel={t.galleryZoomOut}
                            />
                            {car.sold && (
                                <div className="absolute right-4 top-4 z-20 border-l-2 border-[#d91c1c] bg-black/75 px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white">
                                    {t.soldOverlayLabel}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 grid grid-cols-2 border-y border-white/15 sm:grid-cols-4">
                            {[
                                { label: t.statMileage, value: `${car.mileage.toLocaleString('nl-BE')} km` },
                                { label: t.statPower, value: `${car.horsepower} pk` },
                                { label: t.statFuel, value: car.fuel_type },
                                { label: t.statTransmission, value: transmissionLabel },
                            ].map((item, index) => (
                                <div key={item.label} className={`min-w-0 border-white/15 py-5 pr-4 sm:border-l sm:px-6 sm:first:border-l-0 sm:first:pl-0 ${index % 2 ? 'border-l' : ''}`}>
                                    <p className="mb-2 text-[9px] font-extrabold uppercase tracking-[0.16em] text-white/40">{item.label}</p>
                                    <p className="truncate text-sm font-bold text-white/90" title={item.value}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="theme-bg">
                    <div className="mx-auto max-w-[1720px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 xl:px-12">
                        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 xl:gap-20">
                            <article className="min-w-0 lg:col-span-8">
                                <div className="mb-16 flex flex-col gap-8 border-b border-[var(--theme-border)] pb-10 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <p className="mb-3 text-[9px] font-extrabold uppercase tracking-[0.2em] theme-text-faint">01 / {t.specsTitle}</p>
                                        <h2 className="font-headings text-4xl font-semibold uppercase leading-none theme-text sm:text-5xl">{t.specsTitle}</h2>
                                    </div>
                                    {car.carpass_url && (
                                        <a href={car.carpass_url} target="_blank" rel="noopener noreferrer" title="Car-Pass" className="shrink-0 transition-opacity hover:opacity-70">
                                            <Image src={carpassImg} alt="Car-Pass" className="h-11 w-auto object-contain" />
                                        </a>
                                    )}
                                </div>

                                <div className="mb-20 grid grid-cols-1 border-t border-[var(--theme-border)] sm:grid-cols-2 sm:gap-x-12">
                                    {[
                                        { label: t.specBrand, value: car.brand },
                                        { label: t.specColor, value: car.color },
                                        { label: t.specFuel, value: car.fuel_type },
                                        { label: t.specTransmission, value: transmissionLabel },
                                        { label: t.specMileage, value: `${car.mileage.toLocaleString('nl-BE')} km` },
                                        { label: t.specYear, value: car.year },
                                        { label: t.specPower, value: `${car.horsepower} pk` },
                                        { label: t.specCondition, value: t.specConditionValue },
                                    ].map((row) => (
                                        <div key={row.label} className="flex min-h-16 items-center justify-between gap-6 border-b border-[var(--theme-border)]">
                                            <span className="text-xs theme-text-muted">{row.label}</span>
                                            <span className="text-right text-sm font-bold theme-text">{row.value}</span>
                                        </div>
                                    ))}
                                </div>

                                <section className="mb-20 border-t border-[var(--theme-border)] pt-10">
                                    <p className="mb-3 text-[9px] font-extrabold uppercase tracking-[0.2em] theme-text-faint">02 / {t.descriptionTitle}</p>
                                    <h2 className="mb-8 font-headings text-4xl font-semibold uppercase leading-none theme-text sm:text-5xl">{t.descriptionTitle}</h2>
                                    <div className="max-w-3xl border-l-2 border-[#d91c1c] pl-6 sm:pl-8">
                                        <ExpandableDescription
                                            description={car.description}
                                            showMoreLabel={t.descriptionShowMore}
                                            showLessLabel={t.descriptionShowLess}
                                        />
                                    </div>
                                </section>

                                {translatedFeatures.length > 0 && (
                                    <section className="border-t border-[var(--theme-border)] pt-10">
                                        <p className="mb-3 text-[9px] font-extrabold uppercase tracking-[0.2em] theme-text-faint">03 / {t.featuresTitle}</p>
                                        <h2 className="mb-8 font-headings text-4xl font-semibold uppercase leading-none theme-text sm:text-5xl">{t.featuresTitle}</h2>
                                        <ExpandableFeatures
                                            features={translatedFeatures}
                                            showMoreLabel={t.featuresShowMore}
                                            showLessLabel={t.featuresShowLess}
                                        />
                                    </section>
                                )}
                            </article>

                            <aside id="vehicle-contact" className="min-w-0 lg:col-span-4">
                                <div className="space-y-6 lg:sticky lg:top-24">
                                    <CarContactPanel
                                        lang={lang}
                                        carSlug={car.slug}
                                        carTitle={car.title}
                                        whatsappUrl={whatsappUrl}
                                        sold={car.sold ?? false}
                                        dict={dict.carDetail}
                                        securityError={dict.errors.turnstileFailed}
                                    />
                                    <div className="hidden overflow-hidden border border-[var(--theme-border)] lg:block">
                                        <div className="h-[280px] w-full">
                                            <DeferredMap />
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>

                        <Suspense fallback={null}>
                            <RelatedVehicles
                                currentCarId={car.id}
                                brand={dbCar.brand}
                                priceRange={dbCar.price}
                                bodyType={dbCar.bodyType}
                                vehicleType={dbCar.vehicleType}
                                fuelType={dbCar.fuel_type}
                                transmission={dbCar.transmission}
                                year={dbCar.year}
                                mileage={dbCar.mileage}
                                lang={lang}
                                dict={dict.carDetail}
                            />
                        </Suspense>
                    </div>
                </section>
            </main>

            <MobileContactBar carSlug={car.slug} locale={lang} dict={dict.carDetail} whatsappUrl={whatsappUrl} />
            <div className="h-20 lg:hidden" />
            <CarWhatsAppButton whatsappUrl={whatsappUrl} label={t.contactWhatsApp} />
        </div>
    );
}
