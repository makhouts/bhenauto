"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdminRoute = pathname?.startsWith("/admin");
    const isHome = pathname === "/";

    return (
        <>
            {!isAdminRoute && <Header />}
            <main className={`flex-grow ${!isAdminRoute && !isHome ? "pt-20" : ""}`}>
                {children}
            </main>
            {!isAdminRoute && <Footer />}
            {!isAdminRoute && <WhatsAppButton />}
        </>
    );
}

