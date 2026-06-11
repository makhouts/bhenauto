"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarCheck, Car, LayoutDashboard, MessageSquare } from "lucide-react";

type NavItem = {
    href: string;
    label: string;
    badge: number | null;
    badgeWarn?: boolean;
};

const NAV_ICONS = {
    "/admin": LayoutDashboard,
    "/admin/analytics": BarChart3,
    "/admin/cars": Car,
    "/admin/contacts": MessageSquare,
    "/admin/appointments": CalendarCheck,
} as const;

function isActivePath(pathname: string, href: string) {
    if (href === "/admin") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
}

function NavBadge({
    badge,
    warn,
}: {
    badge: number | null;
    warn?: boolean;
}) {
    if (badge === null || badge === undefined || badge <= 0) return null;
    return (
        <span
            className={`ml-auto inline-flex min-w-7 items-center justify-center rounded-full px-2 py-1 text-[11px] font-black leading-none ${
                warn
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-900/8 text-slate-600"
            }`}
        >
            {badge}
        </span>
    );
}

function DesktopLink({
    item,
    pathname,
}: {
    item: NavItem;
    pathname: string;
}) {
    const Icon = NAV_ICONS[item.href as keyof typeof NAV_ICONS] ?? LayoutDashboard;
    const active = isActivePath(pathname, item.href);

    return (
        <Link
            href={item.href}
            className={`group relative flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition-all ${
                active
                    ? "border-[#d91c1c]/18 bg-[#fff2f2] text-[#d91c1c] shadow-[0_12px_26px_rgba(217,28,28,0.10)]"
                    : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-white/70 hover:text-slate-900"
            }`}
        >
            {active ? (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#d91c1c]" />
            ) : null}
            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors ${
                active
                    ? "border-[#d91c1c]/15 bg-white text-[#d91c1c]"
                    : "border-slate-200 bg-white text-slate-400 group-hover:border-slate-300 group-hover:text-slate-700"
            }`}>
                <Icon size={18} />
            </span>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            <NavBadge badge={item.badge} warn={item.badgeWarn} />
        </Link>
    );
}

function MobileLink({
    item,
    pathname,
}: {
    item: NavItem;
    pathname: string;
}) {
    const Icon = NAV_ICONS[item.href as keyof typeof NAV_ICONS] ?? LayoutDashboard;
    const active = isActivePath(pathname, item.href);

    return (
        <Link
            href={item.href}
            className={`flex min-w-[116px] items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-bold transition-colors ${
                active
                    ? "border-[#d91c1c]/18 bg-[#fff2f2] text-[#d91c1c] shadow-[0_8px_20px_rgba(217,28,28,0.08)]"
                    : "border-slate-200 bg-white text-slate-600"
            }`}
        >
            <Icon size={16} className="shrink-0" />
            <span className="truncate">{item.label}</span>
            <NavBadge badge={item.badge} warn={item.badgeWarn} />
        </Link>
    );
}

export default function AdminSidebarNav({
    items,
    mobile = false,
}: {
    items: NavItem[];
    mobile?: boolean;
}) {
    const pathname = usePathname();

    if (mobile) {
        return (
            <div className="flex gap-2 overflow-x-auto px-4 pb-4 pt-2 sm:px-6 lg:hidden">
                {items.map((item) => (
                    <MobileLink key={item.href} item={item} pathname={pathname} />
                ))}
            </div>
        );
    }

    return (
        <nav className="hidden flex-1 flex-col gap-2 lg:flex">
            {items.map((item) => (
                <DesktopLink key={item.href} item={item} pathname={pathname} />
            ))}
        </nav>
    );
}
