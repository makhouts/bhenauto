"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { getAdminDictionary } from "@/lib/admin-i18n";
import { getAdminLocale } from "@/lib/admin-i18n.server";

export async function markContactRead(id: string, read: boolean) {
    await requireAdmin();
    const dict = getAdminDictionary(await getAdminLocale());
    try {
        await prisma.contact.update({
            where: { id },
            data: { read },
        });
        revalidatePath("/admin/contacts");
        return { success: true };
    } catch (error) {
        console.error("Failed to update contact:", error);
        return { error: dict.contactActions.updateError };
    }
}

export async function deleteContact(id: string) {
    await requireAdmin();
    const dict = getAdminDictionary(await getAdminLocale());
    try {
        await prisma.contact.delete({ where: { id } });
        revalidatePath("/admin/contacts");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete contact:", error);
        return { error: dict.contactActions.deleteError };
    }
}
