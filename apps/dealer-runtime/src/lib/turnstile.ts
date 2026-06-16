/**
 * Verifies a Cloudflare Turnstile token server-side.
 * Returns true if valid, false if missing/invalid/expired.
 * In production, missing configuration or verification network failures are denied.
 */
export async function verifyTurnstile(token: string | null | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const isProduction = process.env.NODE_ENV === "production";

  if (!secret) {
    if (!isProduction) {
      console.warn("TURNSTILE_SECRET_KEY not set; skipping Turnstile verification outside production.");
      return true;
    }
    console.error("TURNSTILE_SECRET_KEY is not set in production.");
    return false;
  }

  if (!token) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });

    if (!res.ok) return false;

    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch (error) {
    console.error("Turnstile verification failed.", error);
    return !isProduction;
  }
}
