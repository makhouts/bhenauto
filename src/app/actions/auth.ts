"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, timingSafeEqual } from "crypto";
import { ADMIN_SESSION_MAX_AGE, createSessionToken } from "@/lib/session";
import { getClientIp } from "@/lib/request-ip";
import { getAdminDictionary } from "@/lib/admin-i18n";
import { getAdminLocale } from "@/lib/admin-i18n.server";

// In-memory rate limiter for login attempts (per-process; for production
// multi-instance deployments, move to Redis/Upstash).
const loginAttempts = new Map<string, number[]>();
const LOGIN_WINDOW_MS = 15 * 60_000; // 15 minutes
const LOGIN_MAX_ATTEMPTS = 5;

function isLoginRateLimited(ip: string): boolean {
    const now = Date.now();
    const timestamps = loginAttempts.get(ip)?.filter((t) => now - t < LOGIN_WINDOW_MS) ?? [];
    if (timestamps.length >= LOGIN_MAX_ATTEMPTS) return true;
    timestamps.push(now);
    loginAttempts.set(ip, timestamps);
    return false;
}

/** Hash then compare — removes the length-based timing signal that
 *  timingSafeEqual() exposes when inputs differ in length. */
function constantTimePasswordMatch(candidate: string, expected: string): boolean {
    const a = createHash("sha256").update(candidate).digest();
    const b = createHash("sha256").update(expected).digest();
    return timingSafeEqual(a, b);
}

export async function login(formData: FormData) {
    const password = (formData.get("password") as string | null) ?? "";
    const dict = getAdminDictionary(await getAdminLocale());

    const adminPassword = process.env.ADMIN_PASSWORD;
    const sessionSecret = process.env.ADMIN_SESSION_SECRET;

    if (!adminPassword || !sessionSecret) {
        console.error("[Auth] ADMIN_PASSWORD or ADMIN_SESSION_SECRET env var is not set.");
        return { error: dict.auth.serverConfig };
    }

    const headerStore = await headers();
    const ip = getClientIp(headerStore);
    if (isLoginRateLimited(ip)) {
        return { error: dict.auth.tooManyAttempts };
    }

    const passwordMatch = constantTimePasswordMatch(password, adminPassword);

    if (!passwordMatch) {
        return { error: dict.auth.invalidCredentials };
    }

    // Store a signed, per-login token, not the raw secret.
    const sessionToken = await createSessionToken(sessionSecret);
    const cookieStore = await cookies();
    cookieStore.set("admin_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
        maxAge: ADMIN_SESSION_MAX_AGE,
        path: "/",
    });

    return { success: true };
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
    redirect("/admin/login");
}
