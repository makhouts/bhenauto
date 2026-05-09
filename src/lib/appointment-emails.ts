import { sendMail } from "./mail";
import { format } from "date-fns";
import { nl, fr, enGB } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

const TZ = "Europe/Brussels";
const LOGO_URL = "https://www.bhenauto.com/logo.webp";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AppointmentData {
  name: string;
  email: string;
  date: Date;
  timeSlot: string;
  service: string;
  notes?: string | null;
  locale?: string;
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
  address: string;
  phone: string;
  seeYou: string;
  team: string;
}> = {
  nl: {
    bookingSubject: "Uw afspraak bij BhenAuto is aangevraagd",
    bookingTitle: "Afspraak aangevraagd",
    bookingIntro: (name) => `Beste ${name},`,
    bookingBody: "Bedankt voor uw aanvraag. Wij hebben uw afspraak goed ontvangen en zullen deze zo snel mogelijk bevestigen per e-mail.",
    confirmedSubject: "Uw afspraak bij BhenAuto is bevestigd ✓",
    confirmedTitle: "Afspraak bevestigd",
    confirmedIntro: (name) => `Beste ${name},`,
    confirmedBody: "Goed nieuws! Uw afspraak bij BhenAuto is bevestigd. Hieronder vindt u de details:",
    labelDate: "Datum",
    labelTime: "Tijdstip",
    labelService: "Service",
    labelNotes: "Opmerkingen",
    footer: "Heeft u vragen? Neem gerust contact met ons op.",
    cancelText: "Wilt u uw afspraak annuleren of verzetten? Bel ons op <strong>02 582 83 53</strong> of stuur een bericht via <a href=\"https://wa.me/32477544294\" style=\"color:#d91c1c;text-decoration:none;font-weight:700;\">WhatsApp</a>.",
    address: "Brusselsesteenweg 223, 1730 Asse",
    phone: "02 582 83 53",
    seeYou: "Tot binnenkort!",
    team: "Het BhenAuto Team",
  },
  fr: {
    bookingSubject: "Votre rendez-vous chez BhenAuto a été demandé",
    bookingTitle: "Rendez-vous demandé",
    bookingIntro: (name) => `Cher(e) ${name},`,
    bookingBody: "Merci pour votre demande. Nous avons bien reçu votre rendez-vous et nous le confirmerons dès que possible par e-mail.",
    confirmedSubject: "Votre rendez-vous chez BhenAuto est confirmé ✓",
    confirmedTitle: "Rendez-vous confirmé",
    confirmedIntro: (name) => `Cher(e) ${name},`,
    confirmedBody: "Bonne nouvelle ! Votre rendez-vous chez BhenAuto est confirmé. Voici les détails :",
    labelDate: "Date",
    labelTime: "Heure",
    labelService: "Service",
    labelNotes: "Remarques",
    footer: "Des questions ? N'hésitez pas à nous contacter.",
    cancelText: "Vous souhaitez annuler ou modifier votre rendez-vous ? Appelez-nous au <strong>02 582 83 53</strong> ou envoyez-nous un message via <a href=\"https://wa.me/32477544294\" style=\"color:#d91c1c;text-decoration:none;font-weight:700;\">WhatsApp</a>.",
    address: "Brusselsesteenweg 223, 1730 Asse",
    phone: "02 582 83 53",
    seeYou: "À bientôt !",
    team: "L'équipe BhenAuto",
  },
  en: {
    bookingSubject: "Your appointment at BhenAuto has been requested",
    bookingTitle: "Appointment requested",
    bookingIntro: (name) => `Dear ${name},`,
    bookingBody: "Thank you for your request. We have received your appointment and will confirm it as soon as possible by email.",
    confirmedSubject: "Your appointment at BhenAuto is confirmed ✓",
    confirmedTitle: "Appointment confirmed",
    confirmedIntro: (name) => `Dear ${name},`,
    confirmedBody: "Great news! Your appointment at BhenAuto has been confirmed. Here are the details:",
    labelDate: "Date",
    labelTime: "Time",
    labelService: "Service",
    labelNotes: "Notes",
    footer: "Any questions? Feel free to contact us.",
    cancelText: "Need to cancel or reschedule your appointment? Call us at <strong>02 582 83 53</strong> or send us a message via <a href=\"https://wa.me/32477544294\" style=\"color:#d91c1c;text-decoration:none;font-weight:700;\">WhatsApp</a>.",
    address: "Brusselsesteenweg 223, 1730 Asse",
    phone: "02 582 83 53",
    seeYou: "See you soon!",
    team: "The BhenAuto Team",
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

// ─────────────────────────────────────────────────────────────────────────────
// HTML email layout — BhenAuto branded
// ─────────────────────────────────────────────────────────────────────────────

function emailLayout(title: string, body: string): string {
  const logoImg = `<img src="${LOGO_URL}" alt="BhenAuto" width="180" style="display:block;margin:0 auto 20px;max-width:180px;height:auto;" />`;

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
              <p style="margin:0 0 4px;font-size:12px;color:#6b7280;">BhenAuto BV · Brusselsesteenweg 223, 1730 Asse</p>
              <p style="margin:0 0 4px;font-size:12px;color:#6b7280;">02 582 83 53 · <a href="mailto:info@bhenauto.com" style="color:#d91c1c;text-decoration:none;">info@bhenauto.com</a></p>
              <p style="margin:8px 0 0;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} BhenAuto</p>
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
      <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6;">${value}</td>
    </tr>`;
}

function detailsTable(apt: AppointmentData, locale: Locale): string {
  const t = i18n[locale];
  const rows = [
    detailRow(t.labelDate, formatDate(apt.date, locale)),
    detailRow(t.labelTime, apt.timeSlot),
    detailRow(t.labelService, apt.service),
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
export async function sendBookingReceived(apt: AppointmentData): Promise<void> {
  const locale = (apt.locale as Locale) || "fr";
  const t = i18n[locale];

  const body = `
    <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#111827;">${t.bookingIntro(apt.name)}</p>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">${t.bookingBody}</p>
    <div style="text-align:center;margin-bottom:20px;">${statusBadge(t.bookingTitle, "#f59e0b")}</div>
    ${detailsTable(apt, locale)}
    <p style="margin:20px 0 0;font-size:14px;color:#374151;line-height:1.6;">${t.footer}</p>
    <div style="margin:16px 0;padding:14px 18px;background-color:#fff7ed;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.7;">${t.cancelText}</p>
    </div>
    <p style="margin:16px 0 0;font-size:14px;color:#374151;">${t.seeYou}<br/><strong style="color:#d91c1c;">${t.team}</strong></p>
  `;

  await sendMail({
    to: apt.email,
    subject: t.bookingSubject,
    html: emailLayout(t.bookingTitle, body),
  });
}

/**
 * Send "appointment confirmed" email to the customer.
 * Called when the admin confirms an appointment.
 */
export async function sendAppointmentConfirmed(apt: AppointmentData): Promise<void> {
  const locale = (apt.locale as Locale) || "fr";
  const t = i18n[locale];

  const body = `
    <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#111827;">${t.confirmedIntro(apt.name)}</p>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">${t.confirmedBody}</p>
    <div style="text-align:center;margin-bottom:20px;">${statusBadge(t.confirmedTitle, "#16a34a")}</div>
    ${detailsTable(apt, locale)}
    <div style="margin:24px 0;padding:16px 20px;background-color:#fef2f2;border-left:4px solid #d91c1c;border-radius:0 8px 8px 0;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#d91c1c;text-transform:uppercase;letter-spacing:0.05em;">📍 ${t.address}</p>
      <p style="margin:0;font-size:13px;color:#374151;">📞 ${t.phone} · ✉️ info@bhenauto.com</p>
    </div>
    <p style="margin:20px 0 0;font-size:14px;color:#374151;line-height:1.6;">${t.footer}</p>
    <div style="margin:16px 0;padding:14px 18px;background-color:#fff7ed;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.7;">${t.cancelText}</p>
    </div>
    <p style="margin:16px 0 0;font-size:14px;color:#374151;">${t.seeYou}<br/><strong style="color:#d91c1c;">${t.team}</strong></p>
  `;

  await sendMail({
    to: apt.email,
    subject: t.confirmedSubject,
    html: emailLayout(t.confirmedTitle, body),
  });
}
