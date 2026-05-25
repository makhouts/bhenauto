import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import ContactsClient from "@/components/admin/ContactsClient";
import { requireAdmin } from "@/lib/auth-guard";
import { getAdminDictionary, tpl } from "@/lib/admin-i18n";
import { getAdminLocale } from "@/lib/admin-i18n.server";

export async function generateMetadata(): Promise<Metadata> {
    const dict = getAdminDictionary(await getAdminLocale());
    return {
        title: `${dict.contactsPage.title} | bhenauto Admin`,
    };
}

export default async function ContactsAdminPage() {
    await requireAdmin();
    const dict = getAdminDictionary(await getAdminLocale());
    const contacts = await prisma.contact.findMany({
        orderBy: { createdAt: "desc" },
    });

    const nieuweCount = contacts.filter((c) => !c.read).length;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-slate-200 pb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-headings text-slate-900 mb-2 font-black">{dict.contactsPage.title}</h1>
                    <p className="text-slate-500 font-medium text-sm">{dict.contactsPage.description}</p>
                </div>
                {nieuweCount > 0 && (
                    <div className="flex items-center gap-2 bg-[#d91c1c]/10 border border-[#d91c1c]/20 px-4 py-2 rounded-xl">
                        <span className="w-2 h-2 bg-[#d91c1c] rounded-full animate-pulse" />
                        <span className="text-[#d91c1c] font-bold text-sm">
                            {tpl(nieuweCount === 1 ? dict.contactsPage.badgeSingular : dict.contactsPage.badgePlural, { count: nieuweCount })}
                        </span>
                    </div>
                )}
            </div>

            <ContactsClient contacts={contacts} />
        </div>
    );
}
