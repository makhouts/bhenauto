import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import ContactsClient from "@/components/admin/ContactsClient";
import { requireAdminFeature } from "@/lib/auth-guard";
import { getAdminDictionary } from "@/lib/admin-i18n";
import { getAdminLocale } from "@/lib/admin-i18n.server";
import { AdminPage, AdminPageHeader, AdminSurface } from "@/components/admin/admin-ui";
import { DEFAULT_TENANT_BOOTSTRAP } from "@/lib/tenant-bootstrap";

export async function generateMetadata(): Promise<Metadata> {
    const dict = getAdminDictionary(await getAdminLocale());
    return {
        title: `${dict.contactsPage.title} | ${DEFAULT_TENANT_BOOTSTRAP.adminDisplayName}`,
    };
}

export default async function ContactsAdminPage() {
    await requireAdminFeature("contacts");
    const dict = getAdminDictionary(await getAdminLocale());
    const contacts = await prisma.contact.findMany({
        orderBy: { createdAt: "desc" },
    });

    return (
        <AdminPage>
            <AdminPageHeader
                eyebrow={dict.layout.nav.contacts}
                title={dict.contactsPage.title}
                description={dict.contactsPage.description}
            />

            <AdminSurface padded={false}>
                <ContactsClient contacts={contacts} />
            </AdminSurface>
        </AdminPage>
    );
}
