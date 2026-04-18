import { ReactNode } from "react";
import { cookies } from "next/headers";
import { isValidSession } from "@/lib/session";
import Link from "next/link";
import { Car, MessageSquare, LayoutDashboard, LogOut, CalendarCheck } from "lucide-react";
import { Toaster } from "sonner";
import prisma from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");
    const isAuthenticated = await isValidSession(session?.value);

    // Middleware already guards all /admin/* routes (except /admin/login).
    // If the user is NOT authenticated here, they can only be on /admin/login
    // (middleware would have redirected them otherwise).
    // Render login without the sidebar shell — no redirect needed.
    if (!isAuthenticated) {
        return <>{children}</>;
    }

    const [carCount, nieuweAanvragen, pendingAppointments] = await Promise.all([
        prisma.car.count(),
        prisma.contact.count({ where: { read: false } }),
        prisma.appointment.count({ where: { status: "pending" } }),
    ]);

    const navItems = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard, badge: null },
        { href: "/admin/cars", label: "Voorraad", icon: Car, badge: carCount },
        { href: "/admin/contacts", label: "Aanvragen", icon: MessageSquare, badge: nieuweAanvragen || null },
        { href: "/admin/appointments", label: "Afspraken", icon: CalendarCheck, badge: pendingAppointments || null, badgeWarn: true },
    ];

    return (
        <div className="min-h-screen flex flex-col md:flex-row" style={{ background: "#f4f5f7" }}>

            {/* ── Sidebar ── */}
            <aside
                className="w-full md:w-[240px] shrink-0 flex flex-col"
                style={{
                    background: "#020214",
                    borderRight: "1px solid rgba(255,255,255,0.06)",
                }}
            >
                {/* Logo */}
                <div className="h-[72px] flex items-center px-7" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <Link href="/admin" className="text-[1.3rem] font-headings font-black tracking-tight text-white">
                        bhen<span style={{ color: "#d91c1c" }}>admin</span>
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navItems.map(({ href, label, icon: Icon, badge, badgeWarn }) => (
                        <Link
                            key={href}
                            href={href}
                            className="group flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all duration-200"
                            style={{ color: "rgba(180,190,220,0.85)" }}
                        // active state handled by hover; Next.js can't tell here easily without client
                        >
                            <Icon size={17} className="shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
                            <span className="group-hover:text-white transition-colors">{label}</span>
                            {badge !== null && badge !== undefined && badge > 0 && (
                                <span
                                    className="ml-auto text-[11px] font-black px-2 py-0.5 rounded-full leading-none"
                                    style={
                                        badgeWarn
                                            ? { background: "rgba(251,191,36,0.15)", color: "#fbbf24" }
                                            : { background: "rgba(255,255,255,0.08)", color: "rgba(200,210,240,0.9)" }
                                    }
                                >
                                    {badge}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Logout */}
                <div className="px-4 pb-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.25rem" }}>
                    <form>
                        <button
                            formAction={async () => {
                                "use server";
                                const { logout } = await import("@/app/actions/auth");
                                await logout();
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[13px] font-bold transition-all duration-200 hover:bg-red-500/10"
                            style={{ color: "rgba(248,113,113,0.8)" }}
                        >
                            <LogOut size={17} className="shrink-0" />
                            Uitloggen
                        </button>
                    </form>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto p-6 md:p-10">
                    {children}
                </div>
            </main>

            <Toaster
                position="bottom-right"
                toastOptions={{
                    style: {
                        fontFamily: "var(--font-inter)",
                        borderRadius: "12px",
                        fontSize: "13px",
                        fontWeight: "600",
                    },
                }}
                closeButton
                richColors
            />
        </div>
    );
}
