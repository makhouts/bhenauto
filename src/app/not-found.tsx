// Root 404 fallback — handles routes that don't match any segment (e.g. /doesnt-exist).
// Detects locale via x-pathname header (same middleware pattern) and loads the correct dict.

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

export default async function NotFound() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  return <NotFoundClient dict={dict.notFound} locale={locale} />;
}
