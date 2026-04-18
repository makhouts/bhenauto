// Central i18n configuration
// All locale-related constants and helpers live here

export const locales = ['nl', 'fr', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

export const localeNames: Record<Locale, string> = {
  nl: 'Nederlands',
  fr: 'Français',
  en: 'English',
};

export const localeFlags: Record<Locale, string> = {
  nl: '🇳🇱',
  fr: '🇫🇷',
  en: '🇬🇧',
};

/** Type guard: check if a string is a valid locale */
export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

/**
 * Parse the Accept-Language header and return the best matching locale.
 * Supports loose matching: nl-BE → nl, fr-FR → fr, etc.
 * Returns null if no match found.
 */
export function parseAcceptLanguage(header: string): Locale | null {
  // Parse entries like "nl-BE,nl;q=0.9,fr;q=0.8,en;q=0.7"
  const entries = header
    .split(',')
    .map((part) => {
      const [lang, qPart] = part.trim().split(';');
      const q = qPart ? parseFloat(qPart.split('=')[1]) : 1;
      return { lang: lang.trim().toLowerCase(), q };
    })
    .sort((a, b) => b.q - a.q); // highest quality first

  for (const { lang } of entries) {
    // Exact match (e.g. "nl")
    if (isValidLocale(lang)) return lang;

    // Prefix match (e.g. "nl-be" → "nl")
    const prefix = lang.split('-')[0];
    if (isValidLocale(prefix)) return prefix;
  }

  return null;
}
