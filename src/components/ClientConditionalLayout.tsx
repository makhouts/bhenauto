"use client";

import { usePathname } from "next/navigation";
import { locales } from "@/lib/i18n";

function stripLocale(pathname: string): string {
  const segments = pathname.split("/");
  if (segments[1] && (locales as readonly string[]).includes(segments[1])) {
    const rest = "/" + segments.slice(2).join("/");
    return rest === "/" ? "/" : rest;
  }
  return pathname;
}

interface ClientConditionalLayoutProps {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  whatsApp: React.ReactNode;
}

/**
 * Handles client-side conditional rendering of Header/Footer based on pathname.
 * Header/Footer themselves are rendered by the Server Component parent so they
 * receive the correct dict without any client-side fetching.
 */
export default function ClientConditionalLayout({
  children,
  header,
  footer,
  whatsApp,
}: ClientConditionalLayoutProps) {
  const pathname = usePathname();
  const strippedPath = stripLocale(pathname);

  const isAdminRoute = pathname?.startsWith("/admin");
  const isHome = strippedPath === "/";
  const isTransparentRoute = isHome || strippedPath === "/werkplaats";
  // On car detail pages, hide the global WhatsApp button — the page renders its own
  // car-specific one with the vehicle title pre-filled in the message.
  const isCarDetailPage = /^\/cars\/[^/]+/.test(strippedPath);

  return (
    <>
      {!isAdminRoute && header}
      <main className={`flex-grow ${!isAdminRoute && !isTransparentRoute ? "pt-20" : ""}`}>
        {children}
      </main>
      {!isAdminRoute && footer}
      {!isAdminRoute && !isCarDetailPage && whatsApp}
    </>
  );
}
