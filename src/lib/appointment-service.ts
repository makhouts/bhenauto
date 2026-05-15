import type { Locale } from "@/lib/i18n";
import nlDict from "@/dictionaries/nl.json";
import frDict from "@/dictionaries/fr.json";
import enDict from "@/dictionaries/en.json";

const SERVICE_TITLES: Record<string, Record<string, string>> = {
  nl: Object.fromEntries(nlDict.appointment.services.map((service) => [service.id, service.title])),
  fr: Object.fromEntries(frDict.appointment.services.map((service) => [service.id, service.title])),
  en: Object.fromEntries(enDict.appointment.services.map((service) => [service.id, service.title])),
};

export function getLocalizedAppointmentService(serviceId: string, locale: Locale): string {
  return SERVICE_TITLES[locale][serviceId] ?? serviceId;
}
