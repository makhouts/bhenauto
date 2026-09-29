import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isValidSession } from "@/lib/session";
import { getCarSyncStatuses } from "@/lib/autoscout24/sync-status";

const idsSchema = z.array(z.string().min(1).max(128)).min(1).max(100);

export async function GET(request: NextRequest) {
  if (!await isValidSession(request.cookies.get("admin_session")?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = idsSchema.safeParse(request.nextUrl.searchParams.getAll("id"));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide between 1 and 100 vehicle IDs." }, { status: 400 });
  }
  const cars = await getCarSyncStatuses([...new Set(parsed.data)]);
  return NextResponse.json({ cars }, { headers: { "Cache-Control": "no-store" } });
}
