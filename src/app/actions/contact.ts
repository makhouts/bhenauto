"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { verifyTurnstile } from "@/lib/turnstile";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { getClientIp } from "@/lib/request-ip";

// ─── Rate limiter: 3 submissions per hour per IP (self-hosted: in-memory is reliable) ──
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip)?.filter((t) => now - t < RATE_LIMIT_WINDOW_MS) ?? [];
  if (timestamps.length >= RATE_LIMIT_MAX) return true;
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

export async function submitContact(formData: FormData) {
  const locale = formData.get("locale") as string | null;
  const safeLocale = (locale === "nl" || locale === "fr" || locale === "en" ? locale : "fr") as Locale;
  const dict = await getDictionary(safeLocale);
  const e = (key: keyof typeof dict.errors) => dict.errors[key];

  try {
    // ── Layer 1: Honeypot — bots fill hidden fields ──────────────────────────
    const honeypot = formData.get("website") as string;
    if (honeypot) {
      return { success: true };
    }

    // ── Layer 2: Turnstile CAPTCHA ────────────────────────────────────────────
    const turnstileToken = formData.get("cf-turnstile-response") as string | null;
    const turnstileValid = await verifyTurnstile(turnstileToken);
    if (!turnstileValid) {
      return { error: e("turnstileFailed") };
    }

    // ── Layer 3: Rate limiting — 3/hour per IP ────────────────────────────────
    const headerStore = await headers();
    const ip = getClientIp(headerStore);
    if (isRateLimited(ip)) {
      return { error: e("rateLimited") };
    }

    // ── Extract & sanitize inputs ─────────────────────────────────────────────
    const name = (formData.get("name") as string)?.trim().slice(0, 100);
    const email = (formData.get("email") as string)?.trim().toLowerCase().slice(0, 254);
    const phone = (formData.get("phone") as string)?.trim().slice(0, 20) || "";
    const message = (formData.get("message") as string)?.trim().slice(0, 5000);
    const car_reference = (formData.get("car_reference") as string)?.trim().slice(0, 200) || null;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!name || !email || !message) {
      return { error: e("contactMissing") };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: e("invalidEmail") };
    }

    // ── Store in database ─────────────────────────────────────────────────────
    await prisma.contact.create({
      data: { name, email, phone, message, car_reference },
    });

    revalidatePath("/admin/contacts");
    return { success: true };
  } catch (error) {
    console.error("Failed to submit contact form:", error);
    return { error: e("unexpected") };
  }
}
