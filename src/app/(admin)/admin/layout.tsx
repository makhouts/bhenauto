import { ReactNode } from "react";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { isValidSession } from "@/lib/session";
import { manrope } from "@/app/fonts";
import Link from "next/link";
import Image from "next/image";
import { LogOut, Shield } from "lucide-react";
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
        { href: "/admin/cars", label: dict.layout.nav.cars, badge: carCount },
        { href: "/admin/contacts", label: dict.layout.nav.contacts, badge: nieuweAanvragen || null },
        { href: "/admin/appointments", label: dict.layout.nav.appointments, badge: pendingAppointments || null, badgeWarn: true },
    ];

    return (
        <AdminDocument locale={locale}>
            <AdminI18nProvider locale={locale} dict={dict}>
                <div className="min-h-screen bg-[#f3f5f8] text-slate-900 lg:flex">
                    <aside className="hidden w-[292px] shrink-0 border-r border-slate-200/70 bg-[#f8fafc] lg:flex lg:h-screen lg:flex-col lg:sticky lg:top-0">
                        <div className="px-6 pb-6 pt-7">
                            <Link
                                href="/admin"
                                className="flex items-center gap-4 rounded-[28px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)]"
                            >
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#020214] shadow-lg shadow-slate-950/10">
                                    <Image
                                        src={logo}
                                        alt="BhenAuto"
                                        height={34}
                                        style={{ width: "auto", height: "34px" }}
                                        priority
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                                        BhenAuto
                                    </p>
                                    <p className="mt-1 text-lg font-black text-slate-950">
                                        Admin
                                    </p>
                                </div>
                            </Link>
                        </div>

                        <div className="flex-1 px-5 pb-5">
                            <div className="flex h-full flex-col rounded-[32px] border border-slate-200/80 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
                                <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#d91c1c]">
                                            <Shield size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">
                                                BhenAuto Admin
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <AdminSidebarNav items={navItems} />

                                <div className="mt-auto border-t border-slate-100 pt-4">
                                    <div className="mb-3 flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3">
                                        <AdminLocaleSwitcher compact />
                                    </div>
                                    <form>
                                        <button
                                            formAction={async () => {
                                                "use server";
                                                const { logout } = await import("@/app/actions/auth");
                                                await logout();
                                            }}
                                            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50"
                                        >
                                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-500">
                                                <LogOut size={18} className="shrink-0" />
                                            </span>
                                            {dict.layout.logout}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <div className="flex min-w-0 flex-1 flex-col">
                        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/92 backdrop-blur lg:hidden">
                            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
                                <Link href="/admin" className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#020214]">
                                        <Image
                                            src={logo}
                                            alt="BhenAuto"
                                            height={24}
                                            style={{ width: "auto", height: "24px" }}
                                            priority
                                        />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                            BhenAuto
                                        </p>
                                        <p className="text-base font-black text-slate-950">Admin</p>
                                    </div>
                                </Link>
                                <AdminLocaleSwitcher compact />
                            </div>
                            <AdminSidebarNav items={navItems} mobile />
                        </header>

                        <main className="min-h-0 flex-1">
                            <div
                                data-admin-scroll-container
                                className="min-h-screen px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8"
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
                                borderRadius: "16px",
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
