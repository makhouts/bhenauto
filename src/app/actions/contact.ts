"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitContact(formData: FormData) {
    try {
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        const message = formData.get("message") as string;
        const car_reference = formData.get("car_reference") as string;

        if (!name || !email || !message) {
            return { error: "Name, email, and message are required fields." };
        }

        // Store in database
        await prisma.contact.create({
            data: {
                name,
                email,
                phone,
                message,
                car_reference: car_reference || null,
            },
        });

        // In a real application, you would also trigger an email notification here using SendGrid, AWS SES, or similar.

        revalidatePath("/admin/contacts");

        return { success: true };
    } catch (error) {
        console.error("Failed to submit contact form:", error);
        return { error: "An unexpected error occurred. Please try again later." };
    }
}
