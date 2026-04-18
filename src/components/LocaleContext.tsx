"use client";

import { createContext, useContext, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { locales, isValidLocale } from "@/lib/i18n";

const LOCALE_COOKIE = "NEXT_LOCALE";

interface LocaleContextValue {
  locale: Locale;
  switchLocale: (newLocale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "fr",
  switchLocale: () => {},
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = useCallback(
    (newLocale: Locale) => {
      // Set cookie (persists across sessions)
      document.cookie = `${LOCALE_COOKIE}=${newLocale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;

      // Replace the current locale segment in the path
      // pathname is e.g. "/nl/inventory" → we want "/fr/inventory"
      const segments = pathname.split("/");
      if (segments[1] && isValidLocale(segments[1])) {
        segments[1] = newLocale;
      } else {
        // Shouldn't happen, but fallback: prepend locale
        segments.splice(1, 0, newLocale);
      }

      const newPath = segments.join("/") || "/";
      router.push(newPath);
    },
    [pathname, router]
  );

  return (
    <LocaleContext.Provider value={{ locale, switchLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export { locales };
