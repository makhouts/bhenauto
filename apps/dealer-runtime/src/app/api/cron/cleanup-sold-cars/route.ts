import { NextRequest, NextResponse } from "next/server";
import { cleanupSoldCars } from "@/lib/cars/sold-cleanup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRequestToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }
  return request.headers.get("x-cron-secret")?.trim() ?? null;
}

async function handleCleanup(request: NextRequest) {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503 },
    );
  }

  if (getRequestToken(request) !== configuredSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await cleanupSoldCars({
    apply: true,
    retentionDays: 2,
  });

  return NextResponse.json({
    ok: true,
    mode: summary.mode,
    retentionDays: summary.retentionDays,
    cutoff: summary.cutoff.toISOString(),
    carsMatched: summary.carsMatched,
    carsDeleted: summary.carsDeleted,
    imagesDeleted: summary.imagesDeleted,
    actions: summary.actions,
  });
}

export async function GET(request: NextRequest) {
  return handleCleanup(request);
}

export async function POST(request: NextRequest) {
  return handleCleanup(request);
}
