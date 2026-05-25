"use client";

import { usePathname } from "next/navigation";
import NotFoundClient from "@/components/NotFoundClient";
import { defaultLocale, isValidLocale, type Locale } from "@/lib/i18n";
import type { NotFoundDict } from "@/lib/dictionaries";

const notFoundDictionaries: Record<Locale, NotFoundDict> = {
  nl: {
    headline: "Route niet gevonden",
    subline: "Deze pagina lijkt van de parkeerplaats gereden te zijn. Laten we u terugbrengen naar de weg.",
    backHome: "Terug naar Home",
    browseInventory: "Bekijk Voorraad",
    goBack: "Ga terug",
  },
  fr: {
    headline: "Route introuvable",
    subline: "Cette page semble avoir quitté le parking. Laissez-nous vous remettre sur la bonne voie.",
    backHome: "Retour à l'accueil",
    browseInventory: "Voir l'inventaire",
    goBack: "Retour",
  },
  en: {
    headline: "Route Not Found",
    subline: "This page seems to have driven off the lot. Let's get you back on track.",
    backHome: "Back to Home",
    browseInventory: "Browse Inventory",
    goBack: "Go back",
  },
};

export default function NotFoundFromPath() {
  const pathname = usePathname();
  const segment = pathname.split("/")[1];
  const locale = isValidLocale(segment) ? segment : defaultLocale;

  return <NotFoundClient dict={notFoundDictionaries[locale]} locale={locale} />;
}
