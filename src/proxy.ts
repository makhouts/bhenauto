import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy — runs on every request.
 *
 * Responsibilities:
 * 1. Generate a per-request CSP nonce
 * 2. Set Content-Security-Policy header with the nonce
 * 3. Forward the nonce as x-nonce so Server Components can attach it to
 *    inline <script> tags (JSON-LD, etc.)
 * 4. Forward the detected locale as x-locale so the root layout can set
 *    the correct lang attribute on <html> without an inline script
 */
export function proxy(request: NextRequest) {
    // Skip static files — no need to inject a nonce for these
    const { pathname } = request.nextUrl;
    if (
        pathname.startsWith("/_next/static") ||
        pathname.startsWith("/_next/image") ||
        pathname.startsWith("/assets/") ||
        pathname === "/favicon.ico" ||
        pathname === "/icon.png" ||
        pathname === "/icon.svg"
    ) {
        return NextResponse.next();
    }

    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
    const isDev = process.env.NODE_ENV === "development";

    const cspDirectives = [
        `default-src 'self'`,
        // Scripts: self + nonce + strict-dynamic (allow nonce-bootstrapped scripts).
        // unsafe-inline is included for legacy browsers but ignored when nonce is present.
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ""}`,
        // Styles: self + inline (needed for CSS-in-JS / Tailwind runtime)
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
        `font-src 'self' https://fonts.gstatic.com`,
        // Images: self + data URIs + our CDN domains
        `img-src 'self' data: blob: https://images.bhenauto.com https://*.r2.dev https://images.unsplash.com`,
        // Connections: self + Supabase + WhatsApp
        `connect-src 'self' https://*.supabase.co wss://*.supabase.co`,
        `media-src 'self'`,
        `frame-src 'none'`,
        `object-src 'none'`,
        `base-uri 'self'`,
        `form-action 'self' https://wa.me`,
        `upgrade-insecure-requests`,
    ]
        .filter(Boolean)
        .join("; ");

    const requestHeaders = new Headers(request.headers);
    // Pass nonce to Server Components via a custom header
    requestHeaders.set("x-nonce", nonce);
    // Detect locale from the first path segment (e.g. /nl/inventory → "nl")
    const localeMatch = pathname.match(/^\/([a-z]{2})(\/.*)?\/?(\?.*)?$/);
    const locale = localeMatch ? localeMatch[1] : "fr";
    requestHeaders.set("x-locale", locale);

    const response = NextResponse.next({ request: { headers: requestHeaders } });

    // Set CSP on the response
    response.headers.set("Content-Security-Policy", cspDirectives);

    return response;
}

export const config = {
    // Match all routes — static file exclusions are handled inside the proxy function
    matcher: "/:path*",
};
