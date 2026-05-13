import nodemailer from "nodemailer";

const SMTP_HOST = "mail.spacemail.com";
const SMTP_PORT = 587;
const SMTP_USER = process.env.SMTP_USER || "info@bhenauto.com";
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_TIMEOUT_MS = 8_000;

/**
 * Nodemailer transporter.
 * Falls back to console logging when SMTP_PASS is not set (dev mode).
 */
const transporter = SMTP_PASS
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false, // STARTTLS on port 587
      requireTLS: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: SMTP_TIMEOUT_MS,
      greetingTimeout: SMTP_TIMEOUT_MS,
      socketTimeout: SMTP_TIMEOUT_MS,
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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
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

    const info = await withTimeout(
      transporter.sendMail({
        from: `"BhenAuto" <${SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
      SMTP_TIMEOUT_MS,
      `SMTP send via ${SMTP_HOST}:${SMTP_PORT}`
    );

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
