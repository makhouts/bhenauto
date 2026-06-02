import CarForm from "@/components/admin/CarForm";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getAdminDictionary, tpl } from "@/lib/admin-i18n";
import { getAdminLocale } from "@/lib/admin-i18n.server";
import { getAutoScoutFormOptions } from "@/lib/autoscout24/form-options";
import { getTranslatedEquipmentOptions } from "@/lib/autoscout24/translated-options";
import { AdminPage, AdminPageHeader, AdminSurface } from "@/components/admin/admin-ui";
import { isAutoScoutSourceOfTruth } from "@/lib/autoscout24/source-of-truth";
import { getThumbnailImageUrl } from "@/lib/image-url";

export async function generateMetadata(): Promise<Metadata> {
    const dict = getAdminDictionary(await getAdminLocale());
    return {
        title: `${dict.carEditPage.editTitle} | bhenauto Admin`,
    };
}

export default async function EditCarPage(
    props: { params: Promise<{ id: string }> }
) {
    const locale = await getAdminLocale();
    const dict = getAdminDictionary(locale);
    const params = await props.params;
    const car = await prisma.car.findUnique({
        where: { id: params.id },
        include: { images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
    });

    if (!car) {
        notFound();
    }

    const autoScoutManaged = isAutoScoutSourceOfTruth(car.sourceOfTruth);
    const primaryImage = car.images[0]?.url ?? null;
    const previewImageUrl = primaryImage ? getThumbnailImageUrl(primaryImage) : null;
    const formattedPrice = new Intl.NumberFormat(locale === "fr" ? "fr-BE" : "nl-BE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
    }).format(car.price);
    const statusLabel = car.sold
        ? dict.carRow.statuses.sold
        : car.reserved
            ? dict.carRow.statuses.reserved
            : dict.carRow.statuses.available;
    const [autoscoutOptions, translatedFeatures] = autoScoutManaged
        ? [null, car.features]
        : await Promise.all([
            getAutoScoutFormOptions(locale),
            getTranslatedEquipmentOptions(car.equipmentCodes, locale, car.features),
        ]);

    return (
        <AdminPage>
            <AdminPageHeader
                eyebrow={dict.layout.nav.cars}
                title={dict.carEditPage.editTitle}
                description={tpl(dict.carEditPage.editDescription, { name: `${car.year} ${car.brand} ${car.model}` })}
                actions={(
                    <Link
                        href="/admin/cars"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                    >
                        <ArrowLeft size={16} />
                        {dict.carEditPage.back}
                    </Link>
                )}
            />

            <AdminSurface className="max-w-5xl" padded={false}>
                <div className="grid md:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 md:aspect-auto md:min-h-[260px]">
                        {previewImageUrl ? (
                            <Image
                                src={previewImageUrl}
                                alt={`${car.brand} ${car.model}`}
                                fill
                                unoptimized
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 320px"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center bg-slate-100 text-slate-300">
                                <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M18.92 6c-.2-.58-.76-1-1.42-1h-11c-.66 0-1.22.42-1.42 1L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-6z" />
                                </svg>
                            </div>
                        )}
                    </div>
                    <div className="space-y-5 p-5 sm:p-6">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                                {dict.layout.nav.cars}
                            </p>
                            <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-[2rem]">
                                {car.year} {car.brand} {car.model}
                            </h2>
                            <p className="mt-2 text-sm font-medium text-slate-500">
                                {car.title}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-700">
                                {formattedPrice}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-700">
                                {car.mileage.toLocaleString(locale === "fr" ? "fr-BE" : "nl-BE")} km
                            </span>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-700">
                                {statusLabel}
                            </span>
                        </div>
                    </div>
                </div>
            </AdminSurface>

            {autoScoutManaged ? (
                <AdminSurface className="max-w-3xl">
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d91c1c]">
                                {dict.carEditPage.autoscoutManagedTitle}
                            </p>
                            <h2 className="mt-2 text-2xl font-black text-slate-900">
                                {car.year} {car.brand} {car.model}
                            </h2>
                            <p className="mt-2 text-sm font-medium text-slate-600">
                                {dict.carEditPage.autoscoutManagedDescription}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium text-slate-700">
                            {dict.carEditPage.autoscoutManagedBody}
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/admin/cars"
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                            >
                                <ArrowLeft size={16} />
                                {dict.carEditPage.autoscoutManagedBack}
                            </Link>
                            {car.autoscoutUrl ? (
                                <a
                                    href={car.autoscoutUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#d91c1c] px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(217,28,28,0.18)] transition-colors hover:bg-[#b91515]"
                                >
                                    <ExternalLink size={16} />
                                    {dict.carEditPage.autoscoutManagedCta}
                                </a>
                            ) : null}
                        </div>
                    </div>
                </AdminSurface>
            ) : (
                <CarForm initialData={{ ...car, features: translatedFeatures }} autoscoutOptions={autoscoutOptions!} />
            )}
        </AdminPage>
    );
}
