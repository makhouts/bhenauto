import CarForm from "@/components/admin/CarForm";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminDictionary } from "@/lib/admin-i18n";
import { getAdminLocale } from "@/lib/admin-i18n.server";
import { getAutoScoutFormOptions } from "@/lib/autoscout24/form-options";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

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
        <AdminPage>
            <AdminPageHeader
                eyebrow={dict.layout.nav.cars}
                title={dict.carEditPage.newTitle}
                description={dict.carEditPage.newDescription}
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

            <CarForm autoscoutOptions={autoscoutOptions} />
        </AdminPage>
    );
}
