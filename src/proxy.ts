import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, isValidLocale, parseAcceptLanguage, type Locale } from '@/lib/i18n';
import { isValidSession } from '@/lib/session';

const LOCALE_COOKIE = 'NEXT_LOCALE';
const ADMIN_SESSION_COOKIE = 'admin_session';

function hasLocalePrefix(pathname: string): boolean {
  return locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
}

function extractLocale(pathname: string): Locale {
  const candidate = pathname.split('/')[1];
  return candidate && isValidLocale(candidate) ? candidate : defaultLocale;
}

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' https:${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.r2.dev https://images.bhenauto.com https://images.unsplash.com https://maps.gstatic.com https://*.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://wa.me https://api.whatsapp.com",
    "frame-src https://www.google.com https://maps.google.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://wa.me",
    "upgrade-insecure-requests",
  ].join('; ');
}

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const nonce = generateNonce();
  const csp = buildCsp(nonce);

  // ── Guard admin API routes ───────────────────────────────────────────────
  if (pathname.startsWith('/api/upload') || pathname.startsWith('/api/analyze-images')) {
    const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!await isValidSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // ── Guard admin routes at the edge ──────────────────────────────────────
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
    requestHeaders.set('x-nonce', nonce);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('Content-Security-Policy', csp);
    return response;
  }

  // ── Pass through system paths immediately ────────────────────────────────
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    /\.(.+)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // ── Already has a valid locale prefix → forward headers ─────────────────
  if (hasLocalePrefix(pathname)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('x-locale', extractLocale(pathname));
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('Content-Security-Policy', csp);
    return response;
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
    '/((?!_next/static|_next/image|favicon.ico|icon\\.png|robots\\.txt|sitemap\\.xml|.*\\..*).*)',
  ],
};
