import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { locales } from "@/lib/i18n";
import { localizedAlternates, localizedUrl } from "@/lib/site-seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const entries: MetadataRoute.Sitemap = [];

    // Static pages — generate one entry per locale with hreflang alternates
    const staticRoutes = [
        { path: "", changeFrequency: "weekly" as const, priority: 1.0 },
        { path: "/inventory", changeFrequency: "daily" as const, priority: 0.9 },
        { path: "/werkplaats", changeFrequency: "monthly" as const, priority: 0.7 },
        { path: "/contact", changeFrequency: "monthly" as const, priority: 0.7 },
        { path: "/legal", changeFrequency: "yearly" as const, priority: 0.3 },
    ];

    for (const route of staticRoutes) {
        for (const locale of locales) {
            entries.push({
                url: localizedUrl(locale, route.path),
                changeFrequency: route.changeFrequency,
                priority: route.priority,
                alternates: { languages: localizedAlternates(route.path) },
            });
        }
    }

    // Dynamic car pages — one per locale per car
    const cars = await prisma.car.findMany({
        where: { sold: false },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
    });

    for (const car of cars) {
        for (const locale of locales) {
            const path = `/cars/${car.slug}`;

            entries.push({
                url: localizedUrl(locale, path),
                lastModified: car.updatedAt,
                changeFrequency: "weekly" as const,
                priority: 0.8,
                alternates: { languages: localizedAlternates(path) },
            });
        }
    }

    return entries;
}
