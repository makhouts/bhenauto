import { NextRequest, NextResponse } from "next/server";
import { cleanupAutoScoutSyncHistory, processAutoScoutSyncJobs } from "@/lib/autoscout24/sync-jobs";
import { requireCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleAutoScoutSync(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;
  const summary = await processAutoScoutSyncJobs({
    limit: Number.isFinite(limit) ? limit : undefined,
  });
  const cleanup = await cleanupAutoScoutSyncHistory();

  return NextResponse.json({
    ok: true,
    ...summary,
    cleanup: {
      logsDeleted: cleanup.logsDeleted,
      jobsDeleted: cleanup.jobsDeleted,
    },
  });
}

export async function GET(request: NextRequest) {
  return handleAutoScoutSync(request);
}

export async function POST(request: NextRequest) {
  return handleAutoScoutSync(request);
}
