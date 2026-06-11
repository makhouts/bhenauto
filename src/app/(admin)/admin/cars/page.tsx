import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import { startOfDay, subDays } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import CarsTableClient from "@/components/admin/CarsTableClient";
import AutoScoutImportButton from "@/components/admin/AutoScoutImportButton";
import { requireAdmin } from "@/lib/auth-guard";
import { getAdminDictionary } from "@/lib/admin-i18n";
import { getAdminLocale } from "@/lib/admin-i18n.server";
import { AdminPage, AdminPageHeader, AdminSurface } from "@/components/admin/admin-ui";
import { APPOINTMENT_CONFIG } from "@/lib/appointmentConfig";

type UniqueViewRow = {
    carId: string;
    uniqueVisitors: bigint | number | string;
};

function getLocalDayStart(now = new Date()) {
    return fromZonedTime(startOfDay(toZonedTime(now, APPOINTMENT_CONFIG.timezone)), APPOINTMENT_CONFIG.timezone);
}

function toCount(value: bigint | number | string) {
    return typeof value === "bigint" ? Number(value) : Number(value || 0);
}

export async function generateMetadata(): Promise<Metadata> {
    const dict = getAdminDictionary(await getAdminLocale());
    return {
        title: `${dict.carsPage.title} | bhenauto Admin`,
    };
}

export default async function AdminCarsPage() {
    await requireAdmin();
    const dict = getAdminDictionary(await getAdminLocale());
    const last30dStart = subDays(getLocalDayStart(), 29);

    const [cars, allTimeViewCounts, last30dViewCounts, uniqueLast30dRows] = await Promise.all([
        prisma.car.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                images: {
                    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
                    take: 1,
                }
            }
        }),
        prisma.analyticsEvent.groupBy({
            by: ["carId"],
            where: {
                type: "car_detail_view",
                carId: { not: null },
            },
            _count: {
                _all: true,
            },
        }),
        prisma.analyticsEvent.groupBy({
            by: ["carId"],
            where: {
                type: "car_detail_view",
                carId: { not: null },
                createdAt: { gte: last30dStart },
            },
            _count: {
                _all: true,
            },
        }),
        prisma.$queryRaw<UniqueViewRow[]>`
            SELECT
                "carId",
                COUNT(DISTINCT "visitorHash") AS "uniqueVisitors"
            FROM "AnalyticsEvent"
            WHERE "type" = 'car_detail_view'
              AND "carId" IS NOT NULL
              AND "createdAt" >= ${last30dStart}
            GROUP BY "carId"
        `,
    ]);

    const viewsByCarId = new Map(
        allTimeViewCounts
            .filter((row) => row.carId)
            .map((row) => [row.carId as string, row._count._all])
    );
    const viewsLast30dByCarId = new Map(
        last30dViewCounts
            .filter((row) => row.carId)
            .map((row) => [row.carId as string, row._count._all])
    );
    const uniqueViewsLast30dByCarId = new Map(
        uniqueLast30dRows.map((row) => [row.carId, toCount(row.uniqueVisitors)])
    );

    const carsWithViews = cars.map((car) => ({
        ...car,
        detailViewsCount: viewsByCarId.get(car.id) ?? 0,
        detailViewsLast30dCount: viewsLast30dByCarId.get(car.id) ?? 0,
        uniqueViewersLast30dCount: uniqueViewsLast30dByCarId.get(car.id) ?? 0,
    }));

    return (
        <AdminPage>
            <AdminPageHeader
                eyebrow={dict.layout.nav.cars}
                title={dict.carsPage.title}
                description={dict.carsPage.description}
                actions={(
                    <div className="flex flex-wrap items-center justify-end gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm">
                            {dict.carsPage.autoscoutHint}
                        </div>
                        <AutoScoutImportButton />
                    </div>
                )}
            />

            <AdminSurface padded={false}>
                <CarsTableClient cars={carsWithViews} />
            </AdminSurface>
        </AdminPage>
    );
}
