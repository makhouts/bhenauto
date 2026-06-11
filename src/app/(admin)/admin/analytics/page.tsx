import { BarChart3, Car, ExternalLink, MousePointerClick, Users } from "lucide-react";
import { subDays, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import prisma from "@/lib/prisma";
import { APPOINTMENT_CONFIG } from "@/lib/appointmentConfig";
import { requireAdmin } from "@/lib/auth-guard";
import { getAdminDictionary } from "@/lib/admin-i18n";
import { getAdminLocale } from "@/lib/admin-i18n.server";
import {
  AdminBadge,
  AdminMetricCard,
  AdminMetricGrid,
  AdminPage,
  AdminPageHeader,
  AdminSurface,
  AdminSurfaceHeader,
} from "@/components/admin/admin-ui";

export const metadata = { title: "Analytics | bhenauto" };

type CountRow = { count: bigint | number | string };
type TopCarRow = { carId: string; views: bigint | number | string; visitors: bigint | number | string };
type TopPageRow = { path: string; views: bigint | number | string; visitors: bigint | number | string };
type ReferrerRow = { referrerHost: string | null; visitors: bigint | number | string };

function toCount(value: bigint | number | string) {
  return typeof value === "bigint" ? Number(value) : Number(value || 0);
}

function getLocalDayStart(now = new Date()) {
  return fromZonedTime(startOfDay(toZonedTime(now, APPOINTMENT_CONFIG.timezone)), APPOINTMENT_CONFIG.timezone);
}

async function getDistinctVisitorsSince(since: Date) {
  const [row] = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(DISTINCT "visitorHash") AS count
    FROM "AnalyticsEvent"
    WHERE "type" = 'page_view' AND "createdAt" >= ${since}
  `;
  return toCount(row?.count ?? 0);
}

async function getTopCarsSince(since: Date) {
  const rows = await prisma.$queryRaw<TopCarRow[]>`
    SELECT
      "carId",
      COUNT(*) AS views,
      COUNT(DISTINCT "visitorHash") AS visitors
    FROM "AnalyticsEvent"
    WHERE "type" = 'car_detail_view'
      AND "carId" IS NOT NULL
      AND "createdAt" >= ${since}
    GROUP BY "carId"
    ORDER BY COUNT(*) DESC
    LIMIT 10
  `;

  const cars = rows.length === 0
    ? []
    : await prisma.car.findMany({
        where: { id: { in: rows.map((row) => row.carId) } },
        select: {
          id: true,
          brand: true,
          model: true,
          title: true,
          slug: true,
          sold: true,
          reserved: true,
        },
      });

  const carMap = new Map(cars.map((car) => [car.id, car]));
  return rows.map((row) => ({
    carId: row.carId,
    views: toCount(row.views),
    visitors: toCount(row.visitors),
    clicks: 0,
    car: carMap.get(row.carId) ?? null,
  }));
}

async function getInventoryClicksSince(since: Date) {
  const rows = await prisma.$queryRaw<TopCarRow[]>`
    SELECT
      "carId",
      COUNT(*) AS views,
      COUNT(DISTINCT "visitorHash") AS visitors
    FROM "AnalyticsEvent"
    WHERE "type" = 'car_card_click'
      AND "carId" IS NOT NULL
      AND "createdAt" >= ${since}
    GROUP BY "carId"
  `;

  return new Map(rows.map((row) => [row.carId, toCount(row.views)]));
}

export default async function AdminAnalyticsPage() {
  await requireAdmin();

  const locale = await getAdminLocale();
  const dict = getAdminDictionary(locale);

  const todayStart = getLocalDayStart();
  const last7dStart = subDays(todayStart, 6);
  const last30dStart = subDays(todayStart, 29);

  const [
    pageViewsToday,
    pageViews7d,
    pageViews30d,
    carViews30d,
    appointmentSubmissions30d,
    contactSubmissions30d,
    visitorsToday,
    visitors7d,
    visitors30d,
    topCarsBase,
    inventoryClicks,
    topPages,
    topReferrers,
  ] = await Promise.all([
    prisma.analyticsEvent.count({ where: { type: "page_view", createdAt: { gte: todayStart } } }),
    prisma.analyticsEvent.count({ where: { type: "page_view", createdAt: { gte: last7dStart } } }),
    prisma.analyticsEvent.count({ where: { type: "page_view", createdAt: { gte: last30dStart } } }),
    prisma.analyticsEvent.count({ where: { type: "car_detail_view", createdAt: { gte: last30dStart } } }),
    prisma.analyticsEvent.count({ where: { type: "appointment_submitted", createdAt: { gte: last30dStart } } }),
    prisma.analyticsEvent.count({ where: { type: "contact_submitted", createdAt: { gte: last30dStart } } }),
    getDistinctVisitorsSince(todayStart),
    getDistinctVisitorsSince(last7dStart),
    getDistinctVisitorsSince(last30dStart),
    getTopCarsSince(last30dStart),
    getInventoryClicksSince(last30dStart),
    prisma.$queryRaw<TopPageRow[]>`
      SELECT
        "path",
        COUNT(*) AS views,
        COUNT(DISTINCT "visitorHash") AS visitors
      FROM "AnalyticsEvent"
      WHERE "type" = 'page_view' AND "createdAt" >= ${last30dStart}
      GROUP BY "path"
      ORDER BY COUNT(*) DESC
      LIMIT 10
    `,
    prisma.$queryRaw<ReferrerRow[]>`
      SELECT
        "referrerHost",
        COUNT(DISTINCT "visitorHash") AS visitors
      FROM "AnalyticsEvent"
      WHERE "type" = 'page_view' AND "createdAt" >= ${last30dStart}
      GROUP BY "referrerHost"
      ORDER BY COUNT(DISTINCT "visitorHash") DESC
      LIMIT 8
    `,
  ]);

  const topCars = topCarsBase.map((row) => ({
    ...row,
    clicks: inventoryClicks.get(row.carId) ?? 0,
  }));

  const leadTotal30d = appointmentSubmissions30d + contactSubmissions30d;

  return (
    <AdminPage className="max-w-[1520px] space-y-8">
      <AdminPageHeader
        eyebrow={new Intl.DateTimeFormat(locale === "fr" ? "fr-BE" : "nl-BE", {
          dateStyle: "full",
          timeZone: APPOINTMENT_CONFIG.timezone,
        }).format(new Date())}
        title={dict.analytics.title}
        description={dict.analytics.description}
        badges={
          <>
            <AdminBadge tone="blue">{dict.analytics.periods.today}</AdminBadge>
            <AdminBadge tone="violet">{dict.analytics.periods.last7d}</AdminBadge>
            <AdminBadge tone="red">{dict.analytics.periods.last30d}</AdminBadge>
          </>
        }
      />

      <AdminMetricGrid className="grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label={dict.analytics.cards.visitors}
          value={visitors30d}
          hint={`${visitorsToday} ${dict.analytics.periods.today.toLowerCase()} · ${visitors7d} ${dict.analytics.periods.last7d.toLowerCase()}`}
          tone="blue"
          icon={<Users size={22} />}
        />
        <AdminMetricCard
          label={dict.analytics.cards.pageViews}
          value={pageViews30d}
          hint={`${pageViewsToday} ${dict.analytics.periods.today.toLowerCase()} · ${pageViews7d} ${dict.analytics.periods.last7d.toLowerCase()}`}
          tone="violet"
          icon={<BarChart3 size={22} />}
        />
        <AdminMetricCard
          label={dict.analytics.cards.carViews}
          value={carViews30d}
          hint={`${topCars.length} ${dict.layout.nav.cars.toLowerCase()}`}
          tone="red"
          icon={<Car size={22} />}
        />
        <AdminMetricCard
          label={dict.analytics.cards.leads}
          value={leadTotal30d}
          hint={`${appointmentSubmissions30d} ${dict.analytics.labels.appointments} · ${contactSubmissions30d} ${dict.analytics.labels.contacts}`}
          tone="green"
          icon={<MousePointerClick size={22} />}
        />
      </AdminMetricGrid>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AdminSurface padded={false}>
          <div className="px-5 py-5 sm:px-6 sm:py-6">
            <AdminSurfaceHeader
              icon={<Car size={18} />}
              title={dict.analytics.sections.topCarsTitle}
              description={dict.analytics.sections.topCarsDescription}
            />
          </div>
          {topCars.length === 0 ? (
            <p className="px-6 pb-6 text-sm font-medium text-slate-500">{dict.analytics.empty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  <tr>
                    <th className="px-6 py-3">{dict.layout.nav.cars}</th>
                    <th className="px-6 py-3">{dict.analytics.labels.detailViews}</th>
                    <th className="px-6 py-3">{dict.analytics.labels.unique}</th>
                    <th className="px-6 py-3">{dict.analytics.labels.inventoryClicks}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topCars.map((row) => (
                    <tr key={row.carId} className="align-top">
                      <td className="px-6 py-4">
                        {row.car ? (
                          <div>
                            <p className="font-bold text-slate-900">{row.car.brand} {row.car.model}</p>
                            <p className="mt-1 text-xs font-medium text-slate-500">{row.car.title}</p>
                          </div>
                        ) : (
                          <p className="font-bold text-slate-500">{row.carId}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900">{row.views}</td>
                      <td className="px-6 py-4 font-semibold text-slate-600">{row.visitors}</td>
                      <td className="px-6 py-4 font-semibold text-slate-600">{row.clicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminSurface>

        <AdminSurface className="space-y-6">
          <div>
            <AdminSurfaceHeader
              icon={<MousePointerClick size={18} />}
              title={dict.analytics.sections.conversionsTitle}
              description={dict.analytics.sections.conversionsDescription}
            />
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{dict.analytics.labels.appointments}</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{appointmentSubmissions30d}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{dict.analytics.labels.contacts}</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{contactSubmissions30d}</p>
              </div>
            </div>
          </div>

          <div>
            <AdminSurfaceHeader
              icon={<ExternalLink size={18} />}
              title={dict.analytics.sections.referrersTitle}
              description={dict.analytics.sections.referrersDescription}
            />
            <div className="mt-5 space-y-3">
              {topReferrers.length === 0 ? (
                <p className="text-sm font-medium text-slate-500">{dict.analytics.empty}</p>
              ) : (
                topReferrers.map((row) => (
                  <div key={row.referrerHost ?? "direct"} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="font-semibold text-slate-700">{row.referrerHost ?? dict.analytics.labels.noReferrer}</p>
                    <span className="text-sm font-black text-slate-950">{toCount(row.visitors)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </AdminSurface>
      </div>

      <AdminSurface padded={false}>
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <AdminSurfaceHeader
            icon={<BarChart3 size={18} />}
            title={dict.analytics.sections.topPagesTitle}
            description={dict.analytics.sections.topPagesDescription}
          />
        </div>
        {topPages.length === 0 ? (
          <p className="px-6 pb-6 text-sm font-medium text-slate-500">{dict.analytics.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                <tr>
                  <th className="px-6 py-3">Path</th>
                  <th className="px-6 py-3">{dict.analytics.labels.views}</th>
                  <th className="px-6 py-3">{dict.analytics.labels.visitors}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topPages.map((row) => (
                  <tr key={row.path}>
                    <td className="px-6 py-4 font-semibold text-slate-700">{row.path}</td>
                    <td className="px-6 py-4 font-black text-slate-950">{toCount(row.views)}</td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{toCount(row.visitors)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSurface>
    </AdminPage>
  );
}
