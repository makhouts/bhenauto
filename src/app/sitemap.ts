import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { locales } from "@/lib/i18n";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bhenauto.be";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const entries: MetadataRoute.Sitemap = [];

    // Static pages — generate one entry per locale with hreflang alternates
    const staticRoutes = [
        { path: "", changeFrequency: "weekly" as const, priority: 1.0 },
        { path: "/inventory", changeFrequency: "daily" as const, priority: 0.9 },
        { path: "/werkplaats", changeFrequency: "monthly" as const, priority: 0.7 },
        { path: "/contact", changeFrequency: "monthly" as const, priority: 0.7 },
    ];

    for (const route of staticRoutes) {
        for (const locale of locales) {
            const languages: Record<string, string> = {};
            for (const alt of locales) {
                languages[alt] = `${BASE_URL}/${alt}${route.path}`;
            }

            entries.push({
                url: `${BASE_URL}/${locale}${route.path}`,
                lastModified: new Date(),
                changeFrequency: route.changeFrequency,
                priority: route.priority,
                alternates: { languages },
            });
        }
    }

    // Dynamic car pages — one per locale per car
    const cars = await prisma.car.findMany({
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
    });

    for (const car of cars) {
        for (const locale of locales) {
            const languages: Record<string, string> = {};
            for (const alt of locales) {
                languages[alt] = `${BASE_URL}/${alt}/cars/${car.slug}`;
            }

            entries.push({
                url: `${BASE_URL}/${locale}/cars/${car.slug}`,
                lastModified: car.updatedAt,
                changeFrequency: "weekly" as const,
                priority: 0.8,
                alternates: { languages },
            });
        }
    }

    return entries;
}
