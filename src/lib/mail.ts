import nodemailer from "nodemailer";

const SMTP_HOST = "mail.spacemail.com";
const SMTP_PORT = 465;
const SMTP_USER = process.env.SMTP_USER || "info@bhenauto.com";
const SMTP_PASS = process.env.SMTP_PASS;

/**
 * Nodemailer transporter.
 * Falls back to console logging when SMTP_PASS is not set (dev mode).
 */
const transporter = SMTP_PASS
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: true, // SSL on port 465
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export type MailResult =
  | { success: true; skipped?: boolean }
  | { success: false; error: string };

function getMailErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * Send an email. If SMTP is not configured, logs the email to console instead.
 * Never throws; callers should inspect the returned status in production logs.
 */
export async function sendMail(options: MailOptions): Promise<MailResult> {
  try {
    if (!transporter) {
      console.log("═══ EMAIL (dev — no SMTP configured) ═══");
      console.log(`  To:      ${options.to}`);
      console.log(`  Subject: ${options.subject}`);
      console.log(`  HTML:    ${options.html.slice(0, 200)}…`);
      console.log("═════════════════════════════════════════");
      return { success: true, skipped: true };
    }

    const info = await transporter.sendMail({
      from: `"BhenAuto" <${SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`Email sent to ${options.to}: ${options.subject}`, {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
    return { success: true };
  } catch (err) {
    const message = getMailErrorMessage(err);
    console.error(`Failed to send email to ${options.to}: ${options.subject}`, err);
    return { success: false, error: message };
  }
}
