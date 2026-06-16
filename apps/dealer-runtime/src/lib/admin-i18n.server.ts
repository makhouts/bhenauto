import { cookies } from "next/headers";
import { ADMIN_LOCALE_COOKIE, isValidAdminLocale, type AdminLocale } from "@/lib/admin-i18n";

export async function getAdminLocale(): Promise<AdminLocale> {
    const cookieStore = await cookies();
    const locale = cookieStore.get(ADMIN_LOCALE_COOKIE)?.value;
    return isValidAdminLocale(locale) ? locale : "nl";
}
