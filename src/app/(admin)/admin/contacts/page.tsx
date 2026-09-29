import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import ContactsClient from "@/components/admin/ContactsClient";
import { requireAdmin } from "@/lib/auth-guard";
import { getAdminDictionary } from "@/lib/admin-i18n";
import { getAdminLocale } from "@/lib/admin-i18n.server";
import { AdminPage, AdminPageHeader, AdminSurface } from "@/components/admin/admin-ui";
import { contactQuery, pageWindow, type SearchParams } from "@/lib/admin-list-query";

export async function generateMetadata(): Promise<Metadata> {
    const dict = getAdminDictionary(await getAdminLocale());
    return {
        title: `${dict.contactsPage.title} | bhenauto Admin`,
    };
}

export default async function ContactsAdminPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    await requireAdmin();
    const dict = getAdminDictionary(await getAdminLocale());
    const filters = contactQuery(await searchParams);
    const [groups, total] = await Promise.all([
        prisma.contact.groupBy({ by: ["read"], _count: { _all: true } }),
        prisma.contact.count({ where: filters.where }),
    ]);
    const counts = {
        nieuw: groups.find((group) => !group.read)?._count._all ?? 0,
        behandeld: groups.find((group) => group.read)?._count._all ?? 0,
    };
    const pagination = pageWindow(filters.requestedPage, total);
    const contacts = await prisma.contact.findMany({
        where: filters.where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: pagination.skip, take: pagination.take,
    });

    return (
        <AdminPage>
            <AdminPageHeader
                eyebrow={dict.layout.nav.contacts}
                title={dict.contactsPage.title}
                description={dict.contactsPage.description}
            />

            <AdminSurface padded={false}>
                <ContactsClient contacts={contacts} activeTab={filters.activeTab} query={filters.query}
                    counts={counts} pagination={{ page: pagination.page, pages: pagination.pages, total }} />
            </AdminSurface>
        </AdminPage>
    );
}
