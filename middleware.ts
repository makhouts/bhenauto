import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, isValidLocale, parseAcceptLanguage, type Locale } from '@/lib/i18n';
import { isValidSession } from '@/lib/session';

const LOCALE_COOKIE = 'NEXT_LOCALE';
const ADMIN_SESSION_COOKIE = 'admin_session';

/**
 * Returns true if the pathname is a locale-prefixed route
 * (i.e. starts with /nl, /fr, or /en).
 */
function hasLocalePrefix(pathname: string): boolean {
  return locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // ── Guard admin API routes ───────────────────────────────────────────────
  // Must come before the general /api passthrough below.
  if (pathname.startsWith('/api/upload') || pathname.startsWith('/api/analyze-images')) {
    const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!await isValidSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // ── Guard admin routes at the edge ──────────────────────────────────────
  // Any path under /admin (except /admin/login itself) requires a valid session.
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login' || pathname.startsWith('/admin/login/');

    if (!isLoginPage) {
      const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
      if (!await isValidSession(session)) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/admin/login';
        loginUrl.search = '';
        return NextResponse.redirect(loginUrl);
      }
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── Pass through system paths immediately ────────────────────────────────
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    /\.(.+)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // ── Already has a valid locale prefix → forward with x-pathname header ──
  if (hasLocalePrefix(pathname)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── Determine preferred locale ───────────────────────────────────────────
  // Priority: 1) NEXT_LOCALE cookie, 2) Accept-Language header, 3) default

  let preferredLocale: Locale = defaultLocale;

  const cookieValue = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieValue && isValidLocale(cookieValue)) {
    preferredLocale = cookieValue;
  } else {
    const acceptLang = request.headers.get('accept-language');
    if (acceptLang) {
      const parsed = parseAcceptLanguage(acceptLang);
      if (parsed) preferredLocale = parsed;
    }
  }

  // ── Redirect to locale-prefixed path ────────────────────────────────────
  const url = request.nextUrl.clone();
  url.pathname = `/${preferredLocale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static (static files)
     * - _next/image  (image optimisation)
     * - favicon.ico
     * - public files (files with extensions: .png, .jpg, .svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon\\.png|robots\\.txt|sitemap\\.xml|.*\\..*).*)',
  ],
};
