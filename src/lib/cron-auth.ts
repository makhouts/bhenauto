import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

function getRequestToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }
  return request.headers.get("x-cron-secret")?.trim() ?? null;
}

function secretsMatch(requestToken: string | null, configuredSecret: string) {
  if (!requestToken) return false;
  const requestBytes = Buffer.from(requestToken);
  const configuredBytes = Buffer.from(configuredSecret);
  return requestBytes.length === configuredBytes.length &&
    timingSafeEqual(requestBytes, configuredBytes);
}

export function requireCronAuth(request: NextRequest) {
  if (!env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503 },
    );
  }

  if (!secretsMatch(getRequestToken(request), env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
