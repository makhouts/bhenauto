import { defaultLocale, locales, type Locale } from "@/lib/i18n";

function normalizeBaseUrl(value?: string) {
  return (value || "https://bhenauto.com").replace(/\/+$/, "");
}

function normalizePath(path = "") {
  if (!path || path === "/") return path === "/" ? "/" : "";
  return path.startsWith("/") ? path : `/${path}`;
}

export const SITE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);

export const ogLocales: Record<Locale, string> = {
  nl: "nl_BE",
  fr: "fr_BE",
  en: "en_GB",
};

export function absoluteUrl(path = "") {
  return `${SITE_URL}${normalizePath(path)}`;
}

export function localizedUrl(locale: Locale, path = "") {
  return absoluteUrl(`/${locale}${normalizePath(path)}`);
}

export function localizedAlternates(path = ""): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of locales) {
    languages[locale] = localizedUrl(locale, path);
  }

  languages["x-default"] = localizedUrl(defaultLocale, path);
  return languages;
}
