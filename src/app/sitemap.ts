import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bhenauto.be";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        { url: `${BASE_URL}`, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
        { url: `${BASE_URL}/inventory`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
        { url: `${BASE_URL}/carrosserie`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
        { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
        { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    ];

    // Dynamic car pages
    const cars = await prisma.car.findMany({
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
    });

    const carPages: MetadataRoute.Sitemap = cars.map((car) => ({
        url: `${BASE_URL}/cars/${car.slug}`,
        lastModified: car.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    return [...staticPages, ...carPages];
}
