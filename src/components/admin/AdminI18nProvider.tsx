"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { AdminDictionary, AdminLocale } from "@/lib/admin-i18n";

type AdminI18nContextValue = {
    locale: AdminLocale;
    dict: AdminDictionary;
};

const AdminI18nContext = createContext<AdminI18nContextValue | null>(null);

export function AdminI18nProvider({
    locale,
    dict,
    children,
}: {
    locale: AdminLocale;
    dict: AdminDictionary;
    children: ReactNode;
}) {
    return (
        <AdminI18nContext.Provider value={{ locale, dict }}>
            {children}
        </AdminI18nContext.Provider>
    );
}

export function useAdminI18n() {
    const value = useContext(AdminI18nContext);
    if (!value) {
        throw new Error("useAdminI18n must be used within AdminI18nProvider");
    }
    return value;
}
