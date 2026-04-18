"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "crypto";
import { deriveSessionToken } from "@/lib/session";

export async function login(formData: FormData) {
    const password = formData.get("password") as string;

    const adminPassword = process.env.ADMIN_PASSWORD;
    const sessionSecret = process.env.ADMIN_SESSION_SECRET;

    if (!adminPassword || !sessionSecret) {
        console.error("[Auth] ADMIN_PASSWORD or ADMIN_SESSION_SECRET env var is not set.");
        return { error: "Server configuration error. Contact the administrator." };
    }

    // Timing-safe password comparison to prevent timing attacks
    let passwordMatch = false;
    try {
        passwordMatch = timingSafeEqual(
            Buffer.from(password ?? ""),
            Buffer.from(adminPassword)
        );
    } catch {
        passwordMatch = false;
    }

    if (!passwordMatch) {
        return { error: "Onjuiste inloggegevens." };
    }

    // Store the HMAC-derived token, not the raw secret
    const sessionToken = await deriveSessionToken(sessionSecret);
    const cookieStore = await cookies();
    cookieStore.set("admin_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
        maxAge: 60 * 60 * 2, // 2 hours
        path: "/",
    });

    return { success: true };
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
    redirect("/admin/login");
}
