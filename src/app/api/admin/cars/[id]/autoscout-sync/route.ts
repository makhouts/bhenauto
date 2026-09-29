import { NextRequest, NextResponse } from "next/server";
import { getCarSyncStatuses } from "@/lib/autoscout24/sync-status";
import { isValidSession } from "@/lib/session";

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> },
) {
    const sessionCookie = request.cookies.get("admin_session")?.value;
    if (!await isValidSession(sessionCookie)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;
    const [car] = await getCarSyncStatuses([id]);

    if (!car) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(car, {
        headers: {
            "Cache-Control": "no-store",
        },
    });
}
