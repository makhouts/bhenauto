import { ReactNode } from "react";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { isValidSession } from "@/lib/session";
import { manrope } from "@/app/fonts";
import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { Toaster } from "sonner";
import prisma from "@/lib/prisma";
import logo from "@/assets/logo.webp";
import { AdminI18nProvider } from "@/components/admin/AdminI18nProvider";
import AdminLocaleSwitcher from "@/components/admin/AdminLocaleSwitcher";
import AdminSidebarNav from "@/components/admin/AdminSidebarNav";
import { getAdminDictionary } from "@/lib/admin-i18n";
import { getAdminLocale } from "@/lib/admin-i18n.server";
import "../../globals.css";

// Ensure every /admin/* response carries X-Robots-Tag: noindex,nofollow.
// robots.txt is advisory; this header is a hard signal to compliant crawlers.
export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

function AdminDocument({
    children,
    locale,
}: {
    children: ReactNode;
    locale: string;
}) {
    return (
        <html lang={locale} className="scroll-smooth" data-scroll-behavior="smooth">
            <head>
                <link rel="dns-prefetch" href="https://images.bhenauto.com" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <meta name="theme-color" content="#020214" />
            </head>
            <body className={`${manrope.variable} antialiased min-h-screen flex flex-col`}>
                {children}
            </body>
        </html>
    );
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");
    const isAuthenticated = await isValidSession(session?.value);
    const locale = await getAdminLocale();
    const dict = getAdminDictionary(locale);

    // The proxy guards all /admin/* routes except /admin/login.
    // When unauthenticated, we can only be on /admin/login — render it
    // without the sidebar shell. Do NOT redirect here: this layout wraps
    // /admin/login itself, so redirecting would create an infinite loop.
    if (!isAuthenticated) {
        return (
            <AdminDocument locale={locale}>
                <AdminI18nProvider locale={locale} dict={dict}>
                    {children}
                </AdminI18nProvider>
            </AdminDocument>
        );
    }

    const [carCount, nieuweAanvragen, pendingAppointments] = await Promise.all([
        prisma.car.count(),
        prisma.contact.count({ where: { read: false } }),
        prisma.appointment.count({ where: { status: "pending" } }),
    ]);

    const navItems = [
        { href: "/admin", label: dict.layout.nav.dashboard, badge: null },
        { href: "/admin/analytics", label: dict.layout.nav.analytics, badge: null },
        { href: "/admin/cars", label: dict.layout.nav.cars, badge: carCount },
        { href: "/admin/contacts", label: dict.layout.nav.contacts, badge: nieuweAanvragen || null },
        { href: "/admin/appointments", label: dict.layout.nav.appointments, badge: pendingAppointments || null, badgeWarn: true },
    ];

    return (
        <AdminDocument locale={locale}>
            <AdminI18nProvider locale={locale} dict={dict}>
                <div className="min-h-screen bg-[#efeee9] text-[#17171b] lg:flex">
                    <aside className="hidden w-[272px] shrink-0 border-r border-white/10 bg-[#111116] text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
                        <div className="border-b border-white/10 px-8 py-8">
                            <Link
                                href="/admin"
                                className="group flex items-center justify-between gap-5"
                            >
                                <div className="border-l-2 border-[#d91c1c] pl-5">
                                    <Image
                                        src={logo}
                                        alt="BhenAuto"
                                        height={30}
                                        style={{ width: "auto", height: "30px" }}
                                        priority
                                    />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35 transition-colors group-hover:text-white/60">Admin</span>
                            </Link>
                        </div>

                        <div className="flex flex-1 flex-col px-5 py-7">
                            <AdminSidebarNav items={navItems} />

                            <div className="mt-auto border-t border-white/10 pt-6">
                                <div className="mb-5 px-3">
                                    <AdminLocaleSwitcher />
                                </div>
                                <form>
                                    <button
                                        formAction={async () => {
                                            "use server";
                                            const { logout } = await import("@/app/actions/auth");
                                            await logout();
                                        }}
                                        className="group flex min-h-12 w-full items-center gap-3 border border-transparent px-3 text-sm font-bold text-white/50 transition-colors hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                                    >
                                        <LogOut size={17} className="shrink-0 text-[#d91c1c]" />
                                        {dict.layout.logout}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </aside>

                    <div className="flex min-w-0 flex-1 flex-col">
                        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#111116]/95 text-white backdrop-blur lg:hidden">
                            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
                                <Link href="/admin" className="flex items-center gap-3">
                                    <div className="border-l-2 border-[#d91c1c] pl-3">
                                        <Image
                                            src={logo}
                                            alt="BhenAuto"
                                            height={22}
                                            style={{ width: "auto", height: "22px" }}
                                            priority
                                        />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.22em] text-white/40">Admin</span>
                                </Link>
                                <AdminLocaleSwitcher />
                            </div>
                            <AdminSidebarNav items={navItems} mobile />
                        </header>

                        <main className="min-h-0 flex-1">
                            <div
                                data-admin-scroll-container
                                className="min-h-screen px-4 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10 2xl:px-14"
                            >
                                {children}
                            </div>
                        </main>
                    </div>

                    <Toaster
                        position="bottom-right"
                        toastOptions={{
                            style: {
                                fontFamily: "var(--font-manrope)",
                                borderRadius: "2px",
                                fontSize: "13px",
                                fontWeight: "600",
                            },
                        }}
                        closeButton
                        richColors
                    />
                </div>
            </AdminI18nProvider>
        </AdminDocument>
    );
}
