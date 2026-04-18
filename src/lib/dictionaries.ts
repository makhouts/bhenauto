import type { Locale } from './i18n';
import type nlDict from '@/dictionaries/nl.json';

/**
 * Full dictionary type — inferred from nl.json (source of truth).
 * All language files must maintain identical structure.
 */
export type Dictionary = typeof nlDict;

/** Slice types for scoped prop passing (prevents over-fetching on the client) */
export type NavDict          = Dictionary['nav'];
export type HomeDict         = Dictionary['home'];
export type WhyChooseUsDict  = Dictionary['whyChooseUs'];
export type InventoryDict    = Dictionary['inventory'];
export type CarouselDict     = Dictionary['carousel'];
export type WerkplaatsDict   = Dictionary['werkplaats'];
export type AppointmentDict  = Dictionary['appointment'];
export type ContactDict      = Dictionary['contact'];
export type FooterDict       = Dictionary['footer'];
export type CommonDict       = Dictionary['common'];
export type NotFoundDict     = Dictionary['notFound'];
export type CarDetailDict    = Dictionary['carDetail'];

/**
 * Lazy-load dictionaries per locale — only the requested locale is imported.
 * Never imported client-side; always called from Server Components only.
 */
const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  nl: () => import('@/dictionaries/nl.json').then((m) => m.default),
  fr: () => import('@/dictionaries/fr.json').then((m) => m.default),
  en: () => import('@/dictionaries/en.json').then((m) => m.default),
};

/**
 * Server-only: load and return the full dictionary for a locale.
 * Call this in Server Components only. Pass slices to client components as props.
 */
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
