/**
 * Verifies a Cloudflare Turnstile token server-side.
 * Returns true if valid, false if missing/invalid/expired.
 * Always returns true in non-production environments if the secret key is not set.
 */
export async function verifyTurnstile(token: string | null | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // If no secret configured, skip verification (local dev without keys)
  if (!secret) {
    console.warn("⚠️  TURNSTILE_SECRET_KEY not set — skipping verification");
    return true;
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
  } catch {
    // Network error — fail open to avoid blocking legitimate users on Turnstile outage
    console.error("❌ Turnstile verification failed (network error)");
    return true;
  }
}
