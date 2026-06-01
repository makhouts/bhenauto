import CarForm from "@/components/admin/CarForm";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAdminDictionary, tpl } from "@/lib/admin-i18n";
import { getAdminLocale } from "@/lib/admin-i18n.server";
import { getAutoScoutFormOptions } from "@/lib/autoscout24/form-options";
import { getTranslatedEquipmentOptions } from "@/lib/autoscout24/translated-options";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

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
    const autoscoutOptions = await getAutoScoutFormOptions(locale);
    const params = await props.params;
    const car = await prisma.car.findUnique({
        where: { id: params.id },
        include: { images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
    });

    if (!car) {
        notFound();
    }

    const translatedFeatures = await getTranslatedEquipmentOptions(car.equipmentCodes, locale, car.features);

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

            <CarForm initialData={{ ...car, features: translatedFeatures }} autoscoutOptions={autoscoutOptions} />
        </AdminPage>
    );
}
