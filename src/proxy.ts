import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale, isValidLocale, parseAcceptLanguage } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

const COOKIE_NAME = "PREFERRED_LOCALE";
const SESSION_CONTEXT = "bhenauto-admin-session-v1";

/** Validates the admin_session cookie value in the Edge runtime. */
async function isValidAdminSession(sessionValue: string | undefined): Promise<boolean> {
  if (!sessionValue) return false;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;
  try {
    const enc = new TextEncoder();
    const key = await globalThis.crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
    const sessionBytes = new Uint8Array(
      (sessionValue.match(/.{1,2}/g) ?? []).map((b) => parseInt(b, 16))
    );
    return globalThis.crypto.subtle.verify("HMAC", key, sessionBytes, enc.encode(SESSION_CONTEXT));
  } catch {
    return false;
  }
}

/** Map Vercel's x-vercel-ip-country (ISO 3166-1 alpha-2) → locale */
const countryToLocale: Record<string, Locale> = {
  // Dutch-speaking
  NL: "nl",
  // French-speaking
  FR: "fr",
  MC: "fr",
  LU: "fr",
  // Belgium is multi-lingual — Accept-Language is more reliable,
  // but if we fall through to GeoIP we default to French (majority for this business area)
  BE: "fr",
  // English-speaking
  GB: "en",
  US: "en",
  IE: "en",
  AU: "en",
  NZ: "en",
  CA: "en",
};

function detectLocale(request: NextRequest): Locale {
  // 1. Saved preference (cookie)
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (cookie && isValidLocale(cookie)) return cookie;

  // 2. Accept-Language header
  const acceptLang = request.headers.get("accept-language");
  if (acceptLang) {
    const matched = parseAcceptLanguage(acceptLang);
    if (matched) return matched;
  }

  // 3. GeoIP country (Vercel provides this header)
  const country = request.headers.get("x-vercel-ip-country");
  if (country && countryToLocale[country]) {
    return countryToLocale[country];
  }

  // 4. Default locale
  return defaultLocale;
}

/** Check if the pathname already starts with a known locale */
function pathnameHasLocale(pathname: string): boolean {
  return locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin auth guard ──────────────────────────────────────────────────────
  // All /admin/* routes require a valid session, except /admin/login itself.
  // Always return early for /admin/* — never fall through to locale detection
  // (locale detection would redirect /admin/login → /nl/admin/login → 404).
  if (pathname.startsWith("/admin")) {
    if (pathname !== "/admin/login") {
      const sessionCookie = request.cookies.get("admin_session")?.value;
      const authenticated = await isValidAdminSession(sessionCookie);
      if (!authenticated) {
        const notFoundUrl = request.nextUrl.clone();
        notFoundUrl.pathname = "/_not-found";
        return NextResponse.rewrite(notFoundUrl, { status: 404 });
      }
    }
    return NextResponse.next(); // skip locale detection for all /admin/* paths
  }

  // Skip static files, API routes, Next.js internals (no locale handling needed)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/og-") ||
    pathname.startsWith("/apple-touch-icon") ||
    pathname.startsWith("/site.webmanifest") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // If the pathname already has a locale prefix, just pass through
  // but set the x-pathname header for the not-found page and persist the cookie
  if (pathnameHasLocale(pathname)) {
    const locale = pathname.split("/")[1] as Locale;
    const response = NextResponse.next();
    response.headers.set("x-pathname", pathname);
    // Persist locale preference (30 days)
    response.cookies.set(COOKIE_NAME, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
    return response;
  }

  // No locale in path → detect and redirect
  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  
  const response = NextResponse.redirect(url);
  // Persist locale preference (30 days)
  response.cookies.set(COOKIE_NAME, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files
    "/((?!_next/static|_next/image).*)",
  ],
};
