import { sendMail, type MailResult } from "./mail";
import { format } from "date-fns";
import { nl, fr, enGB } from "date-fns/locale";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { getLocalizedAppointmentService } from "./appointment-service";
import { DEFAULT_TENANT_BOOTSTRAP, getTenantBootstrapAddress } from "./tenant-bootstrap";

const BRAND_NAME = DEFAULT_TENANT_BOOTSTRAP.displayName;
const LEGAL_NAME = DEFAULT_TENANT_BOOTSTRAP.legalName;
const TZ = DEFAULT_TENANT_BOOTSTRAP.timeZone;
const LOGO_CDN_ORIGIN = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/+$/, "") || "";
const LOGO_URL = LOGO_CDN_ORIGIN
  ? `${LOGO_CDN_ORIGIN}/${DEFAULT_TENANT_BOOTSTRAP.r2KeyPrefix}-logo-mail.png`
  : "";
const SHOP_ADDRESS = `${getTenantBootstrapAddress(DEFAULT_TENANT_BOOTSTRAP)}, Belgium`;
const SHOP_EMAIL = DEFAULT_TENANT_BOOTSTRAP.supportEmail;
const SHOP_PHONE = DEFAULT_TENANT_BOOTSTRAP.phone;
const WHATSAPP_URL = `https://wa.me/${DEFAULT_TENANT_BOOTSTRAP.whatsappNumber}`;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AppointmentData {
  id?: string;
  name: string;
  email: string;
  date: Date;
  timeSlot: string;
  service: string;
  notes?: string | null;
  locale?: string;
  durationHours?: number;
}

type Locale = "nl" | "fr" | "en";

// ─────────────────────────────────────────────────────────────────────────────
// i18n copy
// ─────────────────────────────────────────────────────────────────────────────

const i18n: Record<Locale, {
  bookingSubject: string;
  bookingTitle: string;
  bookingIntro: (name: string) => string;
  bookingBody: string;
  confirmedSubject: string;
  confirmedTitle: string;
  confirmedIntro: (name: string) => string;
  confirmedBody: string;
  labelDate: string;
  labelTime: string;
  labelService: string;
  labelNotes: string;
  footer: string;
  cancelText: string;
  calendarHint: string;
  address: string;
  phone: string;
  seeYou: string;
  team: string;
}> = {
  nl: {
    bookingSubject: `Uw afspraak bij ${BRAND_NAME} is aangevraagd`,
    bookingTitle: "Afspraak aangevraagd",
    bookingIntro: (name) => `Beste ${name},`,
    bookingBody: "Bedankt voor uw aanvraag. Wij hebben uw afspraak goed ontvangen en zullen deze zo snel mogelijk bevestigen per e-mail.",
    confirmedSubject: `Uw afspraak bij ${BRAND_NAME} is bevestigd ✓`,
    confirmedTitle: "Afspraak bevestigd",
    confirmedIntro: (name) => `Beste ${name},`,
    confirmedBody: `Goed nieuws! Uw afspraak bij ${BRAND_NAME} is bevestigd. Hieronder vindt u de details:`,
    labelDate: "Datum",
    labelTime: "Tijdstip",
    labelService: "Service",
    labelNotes: "Opmerkingen",
    footer: "Heeft u vragen? Neem gerust contact met ons op.",
    cancelText: `Wilt u uw afspraak annuleren of verzetten? Bel ons op <strong>${SHOP_PHONE}</strong> of stuur een bericht via <a href="${WHATSAPP_URL}" style="color:#d91c1c;text-decoration:none;font-weight:700;">WhatsApp</a>.`,
    calendarHint: "In de bijlage vindt u een kalenderbestand (.ics) dat u aan uw agenda kunt toevoegen.",
    address: `${DEFAULT_TENANT_BOOTSTRAP.addressLine}, ${DEFAULT_TENANT_BOOTSTRAP.postalCode} ${DEFAULT_TENANT_BOOTSTRAP.city}`,
    phone: SHOP_PHONE,
    seeYou: "Tot binnenkort!",
    team: `Het ${BRAND_NAME} Team`,
  },
  fr: {
    bookingSubject: `Votre rendez-vous chez ${BRAND_NAME} a été demandé`,
    bookingTitle: "Rendez-vous demandé",
    bookingIntro: (name) => `Cher(e) ${name},`,
    bookingBody: "Merci pour votre demande. Nous avons bien reçu votre rendez-vous et nous le confirmerons dès que possible par e-mail.",
    confirmedSubject: `Votre rendez-vous chez ${BRAND_NAME} est confirmé ✓`,
    confirmedTitle: "Rendez-vous confirmé",
    confirmedIntro: (name) => `Cher(e) ${name},`,
    confirmedBody: `Bonne nouvelle ! Votre rendez-vous chez ${BRAND_NAME} est confirmé. Voici les détails :`,
    labelDate: "Date",
    labelTime: "Heure",
    labelService: "Service",
    labelNotes: "Remarques",
    footer: "Des questions ? N'hésitez pas à nous contacter.",
    cancelText: `Vous souhaitez annuler ou modifier votre rendez-vous ? Appelez-nous au <strong>${SHOP_PHONE}</strong> ou envoyez-nous un message via <a href="${WHATSAPP_URL}" style="color:#d91c1c;text-decoration:none;font-weight:700;">WhatsApp</a>.`,
    calendarHint: "Vous trouverez en pièce jointe un fichier calendrier (.ics) que vous pouvez ajouter à votre agenda.",
    address: `${DEFAULT_TENANT_BOOTSTRAP.addressLine}, ${DEFAULT_TENANT_BOOTSTRAP.postalCode} ${DEFAULT_TENANT_BOOTSTRAP.city}`,
    phone: SHOP_PHONE,
    seeYou: "À bientôt !",
    team: `L'équipe ${BRAND_NAME}`,
  },
  en: {
    bookingSubject: `Your appointment at ${BRAND_NAME} has been requested`,
    bookingTitle: "Appointment requested",
    bookingIntro: (name) => `Dear ${name},`,
    bookingBody: "Thank you for your request. We have received your appointment and will confirm it as soon as possible by email.",
    confirmedSubject: `Your appointment at ${BRAND_NAME} is confirmed ✓`,
    confirmedTitle: "Appointment confirmed",
    confirmedIntro: (name) => `Dear ${name},`,
    confirmedBody: `Great news! Your appointment at ${BRAND_NAME} has been confirmed. Here are the details:`,
    labelDate: "Date",
    labelTime: "Time",
    labelService: "Service",
    labelNotes: "Notes",
    footer: "Any questions? Feel free to contact us.",
    cancelText: `Need to cancel or reschedule your appointment? Call us at <strong>${SHOP_PHONE}</strong> or send us a message via <a href="${WHATSAPP_URL}" style="color:#d91c1c;text-decoration:none;font-weight:700;">WhatsApp</a>.`,
    calendarHint: "Attached is a calendar file (.ics) that you can add to your calendar.",
    address: `${DEFAULT_TENANT_BOOTSTRAP.addressLine}, ${DEFAULT_TENANT_BOOTSTRAP.postalCode} ${DEFAULT_TENANT_BOOTSTRAP.city}`,
    phone: SHOP_PHONE,
    seeYou: "See you soon!",
    team: `The ${BRAND_NAME} Team`,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Date formatting per locale
// ─────────────────────────────────────────────────────────────────────────────

const dateFnsLocales = { nl, fr, en: enGB };

function formatDate(date: Date, locale: Locale): string {
  const zoned = toZonedTime(date, TZ);
  return format(zoned, "EEEE d MMMM yyyy", { locale: dateFnsLocales[locale] });
}

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function buildAppointmentDateTime(date: Date, timeSlot: string): Date {
  const [hour, minute] = timeSlot.split(":").map(Number);
  const localDate = toZonedTime(date, TZ);
  localDate.setHours(hour, minute, 0, 0);
  return fromZonedTime(localDate, TZ);
}

function buildCalendarInvite(apt: AppointmentData, locale: Locale): string {
  const startsAt = buildAppointmentDateTime(apt.date, apt.timeSlot);
  const endsAt = new Date(startsAt.getTime() + (apt.durationHours ?? 1) * 60 * 60 * 1000);
  const serviceName = getLocalizedAppointmentService(apt.service, locale);
  const summary = `${BRAND_NAME} - ${serviceName}`;
  const description = [
    `${i18n[locale].confirmedTitle}: ${serviceName}`,
    `${i18n[locale].labelDate}: ${formatDate(apt.date, locale)}`,
    `${i18n[locale].labelTime}: ${apt.timeSlot}`,
    apt.notes ? `${i18n[locale].labelNotes}: ${apt.notes}` : null,
    `${SHOP_PHONE} · ${SHOP_EMAIL}`,
  ].filter(Boolean).join("\\n");
  const uid = `${apt.id ?? `${apt.email}-${apt.date.toISOString()}-${apt.timeSlot}`.replace(/[^a-zA-Z0-9]/g, "")}@${DEFAULT_TENANT_BOOTSTRAP.slug}.com`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    `PRODID:-//${BRAND_NAME}//Appointments//EN`,
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startsAt)}`,
    `DTEND:${formatIcsDate(endsAt)}`,
    `SUMMARY:${escapeIcs(summary)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    `LOCATION:${escapeIcs(SHOP_ADDRESS)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML email layout — tenant branded
// ─────────────────────────────────────────────────────────────────────────────

function emailLayout(title: string, body: string): string {
  const logoImg = `<img src="${LOGO_URL}" alt="${BRAND_NAME}" width="180" style="display:block;margin:0 auto 20px;max-width:180px;height:auto;" />`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0a0f2e 0%,#111827 60%,#1a0505 100%);padding:32px 40px 28px;border-radius:16px 16px 0 0;text-align:center;">
              ${logoImg}
              <h1 style="margin:0;font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.02em;">${title}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:36px 40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa;padding:24px 40px;border-radius:0 0 16px 16px;border:1px solid #e5e7eb;border-top:none;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#6b7280;">${LEGAL_NAME} · ${DEFAULT_TENANT_BOOTSTRAP.addressLine}, ${DEFAULT_TENANT_BOOTSTRAP.postalCode} ${DEFAULT_TENANT_BOOTSTRAP.city}</p>
              <p style="margin:0 0 4px;font-size:12px;color:#6b7280;">${SHOP_PHONE} · <a href="mailto:${SHOP_EMAIL}" style="color:#d91c1c;text-decoration:none;">${SHOP_EMAIL}</a></p>
              <p style="margin:8px 0 0;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} ${BRAND_NAME}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail table for appointment info
// ─────────────────────────────────────────────────────────────────────────────

function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #f3f4f6;width:110px;vertical-align:top;">${label}</td>
      <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6;">${escapeHtml(value)}</td>
    </tr>`;
}

function detailsTable(apt: AppointmentData, locale: Locale): string {
  const t = i18n[locale];
  const rows = [
    detailRow(t.labelDate, formatDate(apt.date, locale)),
    detailRow(t.labelTime, apt.timeSlot),
    detailRow(t.labelService, getLocalizedAppointmentService(apt.service, locale)),
  ];
  if (apt.notes) {
    rows.push(detailRow(t.labelNotes, apt.notes));
  }
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;border-collapse:separate;">
      ${rows.join("")}
    </table>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Red accent badge
// ─────────────────────────────────────────────────────────────────────────────

function statusBadge(text: string, color: string): string {
  return `<span style="display:inline-block;padding:4px 14px;background-color:${color};color:#ffffff;font-size:11px;font-weight:800;border-radius:6px;text-transform:uppercase;letter-spacing:0.08em;">${text}</span>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send "booking received" email to the customer.
 * Called immediately after a successful booking.
 */
export async function sendBookingReceived(apt: AppointmentData): Promise<MailResult> {
  const locale = (apt.locale as Locale) || "fr";
  const t = i18n[locale];

  const body = `
    <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#111827;">${t.bookingIntro(escapeHtml(apt.name))}</p>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">${t.bookingBody}</p>
    <div style="text-align:center;margin-bottom:20px;">${statusBadge(t.bookingTitle, "#f59e0b")}</div>
    ${detailsTable(apt, locale)}
    <p style="margin:20px 0 0;font-size:14px;color:#374151;line-height:1.6;">${t.footer}</p>
    <div style="margin:16px 0;padding:14px 18px;background-color:#fff7ed;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.7;">${t.cancelText}</p>
    </div>
    <p style="margin:16px 0 0;font-size:14px;color:#374151;">${t.seeYou}<br/><strong style="color:#d91c1c;">${t.team}</strong></p>
  `;

  return sendMail({
    to: apt.email,
    subject: t.bookingSubject,
    html: emailLayout(t.bookingTitle, body),
  });
}

/**
 * Send "appointment confirmed" email to the customer.
 * Called when the admin confirms an appointment.
 */
export async function sendAppointmentConfirmed(apt: AppointmentData): Promise<MailResult> {
  const locale = (apt.locale as Locale) || "fr";
  const t = i18n[locale];
  const calendarInvite = buildCalendarInvite(apt, locale);

  const body = `
    <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#111827;">${t.confirmedIntro(escapeHtml(apt.name))}</p>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">${t.confirmedBody}</p>
    <div style="text-align:center;margin-bottom:20px;">${statusBadge(t.confirmedTitle, "#16a34a")}</div>
    ${detailsTable(apt, locale)}
    <div style="margin:20px 0;padding:14px 18px;background-color:#eff6ff;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:13px;color:#1f2937;line-height:1.7;">${t.calendarHint}</p>
    </div>
    <div style="margin:24px 0;padding:16px 20px;background-color:#fef2f2;border-left:4px solid #d91c1c;border-radius:0 8px 8px 0;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#d91c1c;text-transform:uppercase;letter-spacing:0.05em;">📍 ${t.address}</p>
      <p style="margin:0;font-size:13px;color:#374151;">📞 ${t.phone} · ✉️ ${SHOP_EMAIL}</p>
    </div>
    <p style="margin:20px 0 0;font-size:14px;color:#374151;line-height:1.6;">${t.footer}</p>
    <div style="margin:16px 0;padding:14px 18px;background-color:#fff7ed;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.7;">${t.cancelText}</p>
    </div>
    <p style="margin:16px 0 0;font-size:14px;color:#374151;">${t.seeYou}<br/><strong style="color:#d91c1c;">${t.team}</strong></p>
  `;

  return sendMail({
    to: apt.email,
    subject: t.confirmedSubject,
    html: emailLayout(t.confirmedTitle, body),
    attachments: [
      {
        filename: `${DEFAULT_TENANT_BOOTSTRAP.slug}-appointment.ics`,
        content: calendarInvite,
        contentType: "text/calendar; charset=utf-8; method=PUBLISH",
      },
    ],
  });
}
