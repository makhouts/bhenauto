import { ReactNode } from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { Car, MessageSquare, LayoutDashboard, LogOut } from "lucide-react";
import { Toaster } from "sonner";
import prisma from "@/lib/prisma";

export default async function AdminLayout({
    children,
}: {
    children: ReactNode;
}) {
    // Check if the user is authenticated
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");
    const isAuthenticated = session?.value === "authenticated";

    // Fetch sidebar counts (only when authenticated)
    const [carCount, nieuweAanvragen] = isAuthenticated
        ? await Promise.all([
              prisma.car.count(),
              prisma.contact.count({ where: { read: false } }),
          ])
        : [0, 0];

    // If not authenticated, render only the children (login page)
    // No sidebar, no logout button
    if (!isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
                <div className="h-20 flex items-center justify-center border-b border-slate-200">
                    <Link href="/admin" className="text-xl font-headings font-black text-slate-900 tracking-wide">
                        bhen<span className="text-[#d91c1c]">admin</span>
                    </Link>
                </div>

                <nav className="flex-1 py-8 px-4 space-y-2">
                    <Link
                        href="/admin"
                        className="flex items-center px-4 py-3 text-slate-600 font-bold hover:bg-slate-50 hover:text-[#d91c1c] rounded-lg transition-colors uppercase tracking-widest text-xs"
                    >
                        <LayoutDashboard size={18} className="mr-3" />
                        Dashboard
                    </Link>

                    <Link
                        href="/admin/cars"
                        className="flex items-center px-4 py-3 text-slate-600 font-bold hover:bg-slate-50 hover:text-[#d91c1c] rounded-lg transition-colors uppercase tracking-widest text-xs"
                    >
                        <Car size={18} className="mr-3" />
                        Voorraad
                        <span className="ml-auto bg-slate-100 text-slate-500 text-[11px] font-bold px-2.5 py-1 rounded-full leading-none">
                            {carCount}
                        </span>
                    </Link>

                    <Link
                        href="/admin/contacts"
                        className="flex items-center px-4 py-3 text-slate-600 font-bold hover:bg-slate-50 hover:text-[#d91c1c] rounded-lg transition-colors uppercase tracking-widest text-xs"
                    >
                        <MessageSquare size={18} className="mr-3" />
                        Aanvragen
                        {nieuweAanvragen > 0 && (
                            <span className="ml-auto bg-slate-100 text-slate-500 text-[11px] font-bold px-2.5 py-1 rounded-full leading-none">
                                {nieuweAanvragen}
                            </span>
                        )}
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-200">
                    <form action="/actions/auth" method="POST" className="w-full">
                        <button
                            formAction={async () => {
                                "use server";
                                const { logout } = await import("@/app/actions/auth");
                                await logout();
                            }}
                            className="flex items-center w-full px-4 py-3 text-red-600 font-bold hover:bg-red-50 rounded-lg transition-colors uppercase tracking-widest text-xs"
                        >
                            <LogOut size={18} className="mr-3" />
                            Uitloggen
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                <div className="flex-1 overflow-auto p-4 md:p-8">
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
                richColors
            />
        </div>
    );
}
