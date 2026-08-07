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
            className={`ml-auto inline-flex min-w-7 items-center justify-center rounded-[2px] px-2 py-1 text-[10px] font-black leading-none ${
                warn
                    ? "bg-amber-100 text-amber-700"
                    : "bg-white/10 text-white/65"
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
            className={`group relative flex min-h-12 items-center gap-3 border px-3 text-sm font-bold transition-colors ${
                active
                    ? "border-white/10 bg-white/[0.07] text-white"
                    : "border-transparent text-white/45 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
            }`}
        >
            {active ? (
                <span className="absolute -left-px bottom-2 top-2 w-0.5 bg-[#d91c1c]" />
            ) : null}
            <span className={`flex h-9 w-9 items-center justify-center transition-colors ${active ? "text-[#ef3333]" : "text-white/35 group-hover:text-white/70"}`}>
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
            className={`flex min-h-11 min-w-[116px] items-center gap-2 border px-3 text-sm font-bold transition-colors ${
                active
                    ? "border-[#d91c1c] bg-[#d91c1c] text-white"
                    : "border-white/10 bg-white/[0.04] text-white/55"
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
            <div className="flex gap-2 overflow-x-auto px-4 pb-4 pt-1 sm:px-6 lg:hidden">
                {items.map((item) => (
                    <MobileLink key={item.href} item={item} pathname={pathname} />
                ))}
            </div>
        );
    }

    return (
        <nav className="hidden flex-1 flex-col gap-1.5 lg:flex">
            {items.map((item) => (
                <DesktopLink key={item.href} item={item} pathname={pathname} />
            ))}
        </nav>
    );
}
