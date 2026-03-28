"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function markContactRead(id: string, read: boolean) {
    try {
        await prisma.contact.update({
            where: { id },
            data: { read },
        });
        revalidatePath("/admin/contacts");
        return { success: true };
    } catch (error) {
        console.error("Failed to update contact:", error);
        return { error: "Failed to update contact." };
    }
}

export async function deleteContact(id: string) {
    try {
        await prisma.contact.delete({ where: { id } });
        revalidatePath("/admin/contacts");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete contact:", error);
        return { error: "Failed to delete contact." };
    }
}
