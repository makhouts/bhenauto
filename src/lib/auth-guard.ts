"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidSession } from "@/lib/session";

/**
 * Ensures the caller is an authenticated admin.
 * Validates the session cookie against the HMAC-derived token.
 * Redirects to the login page if not authenticated.
 */
export async function requireAdmin() {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");

    if (!await isValidSession(session?.value)) {
        redirect("/admin/login");
    }
}
