import { NextRequest, NextResponse } from "next/server";
import { cleanupSoldCars } from "@/lib/cars/sold-cleanup";
import { requireCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleCleanup(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

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
