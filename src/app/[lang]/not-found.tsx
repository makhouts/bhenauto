// Locale-aware 404 page — triggered by notFound() within the [lang] segment.
// Reads the locale from the x-pathname header (set by middleware) and loads
// the matching dictionary server-side. Zero client-side dict fetching.

import { headers } from "next/headers";
import { getDictionary } from "@/lib/dictionaries";
import { isValidLocale } from "@/lib/i18n";
import NotFoundClient from "@/components/NotFoundClient";

async function getLocale() {
  const h = await headers();
  const pathname = h.get("x-pathname") || "";
  const segment = pathname.split("/")[1];
  return isValidLocale(segment) ? segment : "fr";
}

export default async function LangNotFound() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  return <NotFoundClient dict={dict.notFound} locale={locale} />;
}
