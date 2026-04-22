import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale, isValidLocale, parseAcceptLanguage } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

const COOKIE_NAME = "PREFERRED_LOCALE";

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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, API routes, admin routes, Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
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
