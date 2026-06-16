import { NextRequest, NextResponse } from "next/server";
import { cleanupAutoScoutSyncHistory, processAutoScoutSyncJobs } from "@/lib/autoscout24/sync-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRequestToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }
  return request.headers.get("x-cron-secret")?.trim() ?? null;
}

async function handleAutoScoutSync(request: NextRequest) {
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
