import { createHash } from "node:crypto";
import { formatInTimeZone } from "date-fns-tz";
import { Prisma, type AnalyticsEventType } from "@/generated/prisma/client";
import { APPOINTMENT_CONFIG } from "@/lib/appointmentConfig";
import { env } from "@/lib/env";
import prisma from "@/lib/prisma";
import { getClientIp } from "@/lib/request-ip";

type HeadersLike = {
  get(name: string): string | null;
};

type TrackAnalyticsEventInput = {
  type: AnalyticsEventType;
  path: string;
  locale?: string | null;
  carId?: string | null;
  referrer?: string | null;
  meta?: Prisma.InputJsonValue;
};

const BOT_UA_PATTERN =
  /bot|crawler|spider|crawling|preview|slurp|lighthouse|pagespeed|curl|wget|python-requests|headlesschrome/i;

function normalizePath(path: string): string {
  if (!path) return "/";

  try {
    const url = path.startsWith("http://") || path.startsWith("https://")
      ? new URL(path)
      : new URL(path, "https://bhenauto.local");
    return url.pathname || "/";
  } catch {
    const pathname = path.split("?")[0]?.split("#")[0]?.trim() || "/";
    return pathname.startsWith("/") ? pathname : `/${pathname}`;
  }
}

function getReferrerHost(referrer?: string | null): string | null {
  if (!referrer) return null;

  try {
    const host = new URL(referrer).hostname.toLowerCase();
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return null;
  }
}

function isBotRequest(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return BOT_UA_PATTERN.test(userAgent);
}

function buildVisitorHash(ip: string, userAgent: string, now = new Date()): string {
  const dayKey = formatInTimeZone(now, APPOINTMENT_CONFIG.timezone, "yyyy-MM-dd");
  return createHash("sha256")
    .update(`${env.ANALYTICS_HASH_SALT ?? env.ADMIN_SESSION_SECRET}:${dayKey}:${ip}:${userAgent}`)
    .digest("hex");
}

export async function trackAnalyticsEvent(
  headerStore: HeadersLike,
  input: TrackAnalyticsEventInput
): Promise<void> {
  const userAgent = headerStore.get("user-agent");
  if (isBotRequest(userAgent)) return;

  const ip = getClientIp(headerStore);
  const visitorHash = buildVisitorHash(ip, userAgent ?? "unknown");

  try {
    await prisma.analyticsEvent.create({
      data: {
        type: input.type,
        path: normalizePath(input.path),
        locale: input.locale ?? null,
        carId: input.carId ?? null,
        referrerHost: getReferrerHost(input.referrer),
        visitorHash,
        meta: input.meta ?? Prisma.JsonNull,
      },
    });
  } catch (error) {
    console.error("Failed to store analytics event", {
      type: input.type,
      path: input.path,
      carId: input.carId,
      error,
    });
  }
}
