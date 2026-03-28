import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
    const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
    const isLoginRoute = request.nextUrl.pathname === "/admin/login";

    if (isAdminRoute && !isLoginRoute) {
        const sessionCookie = request.cookies.get("admin_session");

        if (!sessionCookie || sessionCookie.value !== "authenticated") {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }
    }

    if (isLoginRoute) {
        const sessionCookie = request.cookies.get("admin_session");
        if (sessionCookie?.value === "authenticated") {
            return NextResponse.redirect(new URL("/admin", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
