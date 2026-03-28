import prisma from "@/lib/prisma";
import { Mail } from "lucide-react";
import ContactsClient from "@/components/admin/ContactsClient";

export const metadata = {
    title: "Aanvragen | bhenauto Admin",
};

export default async function ContactsAdminPage() {
    const contacts = await prisma.contact.findMany({
        orderBy: { createdAt: "desc" },
    });

    const nieuweCount = contacts.filter((c) => !c.read).length;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-slate-200 pb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-headings text-slate-900 mb-2 font-black">Klantenaanvragen</h1>
                    <p className="text-slate-500 font-medium text-sm">Beoordeel en beheer inkomende verzoeken van de openbare site.</p>
                </div>
                {nieuweCount > 0 && (
                    <div className="flex items-center gap-2 bg-[#d91c1c]/10 border border-[#d91c1c]/20 px-4 py-2 rounded-xl">
                        <span className="w-2 h-2 bg-[#d91c1c] rounded-full animate-pulse" />
                        <span className="text-[#d91c1c] font-bold text-sm">{nieuweCount} nieuwe {nieuweCount === 1 ? "aanvraag" : "aanvragen"}</span>
                    </div>
                )}
            </div>

            <ContactsClient contacts={contacts} />
        </div>
    );
}
