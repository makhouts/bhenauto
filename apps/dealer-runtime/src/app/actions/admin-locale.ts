"use server";

import { cookies } from "next/headers";
import { ADMIN_LOCALE_COOKIE, isValidAdminLocale, type AdminLocale } from "@/lib/admin-i18n";

export async function setAdminLocale(locale: AdminLocale) {
    if (!isValidAdminLocale(locale)) return;
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_LOCALE_COOKIE, locale, {
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
    });
}
