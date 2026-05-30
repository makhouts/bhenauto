import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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
    const [car, latestJob, latestLog] = await Promise.all([
        prisma.car.findUnique({
            where: { id },
            select: {
                id: true,
                sold: true,
                reserved: true,
                autoscoutListingId: true,
                autoscoutSyncStatus: true,
                autoscoutSyncError: true,
                autoscoutLastPushedAt: true,
                publicationStatus: true,
            },
        }),
        prisma.autoScoutSyncJob.findFirst({
            where: { carId: id },
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                action: true,
                status: true,
                attempts: true,
                maxAttempts: true,
                nextRunAt: true,
                lastError: true,
                finishedAt: true,
            },
        }),
        prisma.autoScoutSyncLog.findFirst({
            where: { carId: id },
            orderBy: { createdAt: "desc" },
            select: {
                status: true,
                message: true,
                createdAt: true,
            },
        }),
    ]);

    if (!car) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
        ...car,
        autoscoutLatestJob: latestJob,
        autoscoutLatestLog: latestLog,
    }, {
        headers: {
            "Cache-Control": "no-store",
        },
    });
}
