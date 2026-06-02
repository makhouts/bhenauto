import { NextRequest, NextResponse } from "next/server";
import {
  AutoScoutImportLockError,
  AutoScoutImportPartialFailureError,
  runAutoScoutImport,
} from "@/lib/autoscout24/importer";
import { requireCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleAutoScoutImport(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  try {
    const summary = await runAutoScoutImport({
      mode: "apply",
      overwriteFromAutoscout: true,
      cleanupSold: true,
    });

    return NextResponse.json({
      ok: true,
      summary,
    }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof AutoScoutImportLockError) {
      return NextResponse.json(
        { error: error.message },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (error instanceof AutoScoutImportPartialFailureError) {
      return NextResponse.json(
        { error: error.message, summary: error.summary },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    console.error("AutoScout24 cron import failed:", error);
    return NextResponse.json(
      { error: "AutoScout24 import failed." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function GET(request: NextRequest) {
  return handleAutoScoutImport(request);
}

export async function POST(request: NextRequest) {
  return handleAutoScoutImport(request);
}
