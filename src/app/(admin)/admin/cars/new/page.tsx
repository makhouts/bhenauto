import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminDictionary } from "@/lib/admin-i18n";
import { getAdminLocale } from "@/lib/admin-i18n.server";
import { AdminPage, AdminPageHeader, AdminSurface } from "@/components/admin/admin-ui";

export async function generateMetadata(): Promise<Metadata> {
    const dict = getAdminDictionary(await getAdminLocale());
    return {
        title: `${dict.carEditPage.newTitle} | bhenauto Admin`,
    };
}

export default async function NewCarPage() {
    const locale = await getAdminLocale();
    const dict = getAdminDictionary(locale);
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

            <AdminSurface className="max-w-3xl">
                <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d91c1c]">
                        {dict.carEditPage.newAutoscoutTitle}
                    </p>
                    <p className="text-sm font-medium text-slate-700">
                        {dict.carEditPage.newAutoscoutDescription}
                    </p>
                </div>
            </AdminSurface>
        </AdminPage>
    );
}
