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
        <div>
            <div className="mb-8">
                <Link
                    href="/admin/cars"
                    className="inline-flex items-center text-slate-400 hover:text-[#d91c1c] transition-colors text-sm uppercase tracking-widest font-semibold mb-6"
                >
                    <ArrowLeft size={16} className="mr-2" /> {dict.carEditPage.back}
                </Link>

                <h1 className="text-[2rem] font-headings font-black text-slate-900 tracking-tight mb-2">{dict.carEditPage.editTitle}</h1>
                <p className="text-slate-500 font-medium text-sm">
                    {tpl(dict.carEditPage.editDescription, { name: `${car.year} ${car.brand} ${car.model}` })}
                </p>
            </div>

            <CarForm initialData={{ ...car, features: translatedFeatures }} autoscoutOptions={autoscoutOptions} />
        </div>
    );
}
