import { NextRequest, NextResponse } from "next/server";
import { isValidSession } from "@/lib/session";
import { getAutoScoutImportStatus } from "@/lib/autoscout24/importer";

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("admin_session")?.value;
  if (!await isValidSession(sessionCookie)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getAutoScoutImportStatus();

  return NextResponse.json({
    running: status.running,
    configured: status.configured,
    lastCompletedAt: status.lastCompletedAt?.toISOString() ?? null,
    lastError: status.lastError,
  }, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
