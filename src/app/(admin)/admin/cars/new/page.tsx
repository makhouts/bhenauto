import CarForm from "@/components/admin/CarForm";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminDictionary } from "@/lib/admin-i18n";
import { getAdminLocale } from "@/lib/admin-i18n.server";
import { getAutoScoutFormOptions } from "@/lib/autoscout24/form-options";

export async function generateMetadata(): Promise<Metadata> {
    const dict = getAdminDictionary(await getAdminLocale());
    return {
        title: `${dict.carEditPage.newTitle} | bhenauto Admin`,
    };
}

export default async function NewCarPage() {
    const locale = await getAdminLocale();
    const dict = getAdminDictionary(locale);
    const autoscoutOptions = await getAutoScoutFormOptions(locale);
    return (
        <div>
            <div className="mb-8">
                <Link
                    href="/admin/cars"
                    className="inline-flex items-center text-slate-400 hover:text-[#d91c1c] transition-colors text-sm uppercase tracking-widest font-semibold mb-6"
                >
                    <ArrowLeft size={16} className="mr-2" /> {dict.carEditPage.back}
                </Link>

                <h1 className="text-[2rem] font-headings font-black text-slate-900 tracking-tight mb-2">{dict.carEditPage.newTitle}</h1>
                <p className="text-slate-500 font-medium text-sm">{dict.carEditPage.newDescription}</p>
            </div>

            <CarForm autoscoutOptions={autoscoutOptions} />
        </div>
    );
}
