"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

// Simple in-memory rate limiter (per-process; for production use Redis/Upstash)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5; // max 5 submissions per minute

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const timestamps = rateLimitMap.get(ip)?.filter((t) => now - t < RATE_LIMIT_WINDOW_MS) ?? [];
    if (timestamps.length >= RATE_LIMIT_MAX) return true;
    timestamps.push(now);
    rateLimitMap.set(ip, timestamps);
    return false;
}

export async function submitContact(formData: FormData) {
    try {
        // Honeypot check — hidden field that bots fill in
        const honeypot = formData.get("website") as string;
        if (honeypot) {
            // Bots fill this — silently succeed to avoid detection
            return { success: true };
        }

        // Rate limiting
        const headerStore = await headers();
        const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        if (isRateLimited(ip)) {
            return { error: "Te veel verzoeken. Probeer het over een minuut opnieuw." };
        }

        // Extract and sanitize inputs
        const name = (formData.get("name") as string)?.trim().slice(0, 100);
        const email = (formData.get("email") as string)?.trim().toLowerCase().slice(0, 254);
        const phone = (formData.get("phone") as string)?.trim().slice(0, 20) || "";
        const message = (formData.get("message") as string)?.trim().slice(0, 5000);
        const car_reference = (formData.get("car_reference") as string)?.trim().slice(0, 200) || null;

        // Validation
        if (!name || !email || !message) {
            return { error: "Naam, e-mailadres en bericht zijn verplichte velden." };
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return { error: "Ongeldig e-mailadres." };
        }

        // Store in database
        await prisma.contact.create({
            data: {
                name,
                email,
                phone,
                message,
                car_reference,
            },
        });

        revalidatePath("/admin/contacts");

        return { success: true };
    } catch (error) {
        console.error("Failed to submit contact form:", error);
        return { error: "Er is een onverwachte fout opgetreden. Probeer het later opnieuw." };
    }
}
