import { ReactNode } from "react";
import type { Metadata } from "next";
import { manrope } from "@/app/fonts";
import { AdminI18nProvider } from "@/components/admin/AdminI18nProvider";
import { getAdminDictionary } from "@/lib/admin-i18n";
import "../../globals.css";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
    referrer: "no-referrer",
};

export default async function WorkshopLayout({ children }: { children: ReactNode }) {
    const locale = "fr";
    const dict = getAdminDictionary(locale);

    return (
        <html lang={locale} className="scroll-smooth" data-scroll-behavior="smooth">
            <head>
                <meta name="referrer" content="no-referrer" />
                <link rel="dns-prefetch" href="https://images.bhenauto.com" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <meta name="theme-color" content="#eef3f8" />
            </head>
            <body className={`${manrope.variable} h-screen overflow-hidden bg-[#eef3f8] antialiased`}>
                <AdminI18nProvider locale={locale} dict={dict}>
                    {children}
                </AdminI18nProvider>
            </body>
        </html>
    );
}
