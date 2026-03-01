"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
    const password = formData.get("password") as string;

    // Hardcoded simple admin password for demonstration purposes
    // In production, use standard authentication, bcrypt, NextAuth, etc.
    if (password === "admin123") {
        const cookieStore = await cookies();
        cookieStore.set("admin_session", "authenticated", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        return { success: true };
    }

    return { error: "Invalid credentials." };
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
    redirect("/admin/login");
}
