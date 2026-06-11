import { NextResponse } from "next/server";
import { z } from "zod";
import { trackAnalyticsEvent } from "@/lib/analytics";

export const runtime = "nodejs";

const AnalyticsPayloadSchema = z.object({
  type: z.enum(["page_view", "car_detail_view", "car_card_click"]),
  path: z.string().min(1).max(300),
  locale: z.string().min(2).max(8).optional().nullable(),
  carId: z.string().min(1).max(50).optional().nullable(),
  referrer: z.string().max(500).optional().nullable(),
  meta: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return new NextResponse(null, { status: 204 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = AnalyticsPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid analytics payload." }, { status: 400 });
  }

  await trackAnalyticsEvent(request.headers, parsed.data);

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
