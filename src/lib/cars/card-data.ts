import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

// Never select the import/sync JSON payloads for cards or tables.
export const carCardSelect = {
  id: true, slug: true, title: true, brand: true, model: true,
  year: true, mileage: true, fuel_type: true, fuelTypeCode: true,
  fuelCategory: true, transmission: true, transmissionCode: true,
  price: true, horsepower: true, featured: true, sold: true,
  reserved: true, createdAt: true,
} satisfies Prisma.CarSelect;

export type CarCardData = Prisma.CarGetPayload<{ select: typeof carCardSelect }>;

// Bound both the description and gallery inside SQL. Full descriptions belong
// on detail pages; slicing after a Prisma read still pays for the full DB egress.
export async function withCardPreviews<T extends { id: string }>(cars: T[]) {
  if (cars.length === 0) return [] as Array<T & { description: string; images: { url: string }[] }>;
  const rows = await prisma.$queryRaw<Array<{ id: string; description: string; images: { url: string }[] }>>(Prisma.sql`
    SELECT car."id", LEFT(car."description", 240) AS description,
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object('url', image."url") ORDER BY image."sortOrder", image."createdAt", image."id")
        FROM (
          SELECT "url", "sortOrder", "createdAt", "id" FROM "Image"
          WHERE "carId" = car."id"
          ORDER BY "sortOrder", "createdAt", "id" LIMIT 2
        ) AS image
      ), '[]'::jsonb) AS images
    FROM "Car" AS car WHERE car."id" IN (${Prisma.join(cars.map((car) => car.id))})
  `);
  const byId = new Map(rows.map((row) => [row.id, row]));
  return cars.map((car) => ({ ...car, description: byId.get(car.id)?.description ?? "", images: byId.get(car.id)?.images ?? [] }));
}

// Prisma's default query relation strategy can fetch every image for every
// parent before applying a per-parent `take` in memory. Apply LIMIT in SQL
// instead: at most 1–2 URL rows per car cross the database connection.
export async function withCardImages<T extends { id: string }>(cars: T[], limit: 1 | 2 = 2) {
  if (cars.length === 0) return [] as Array<T & { images: { url: string }[] }>;
  const rows = await prisma.$queryRaw<Array<{ carId: string; url: string }>>(Prisma.sql`
    SELECT selected."carId", image."url"
    FROM unnest(ARRAY[${Prisma.join(cars.map((car) => car.id))}]::text[]) AS selected("carId")
    CROSS JOIN LATERAL (
      SELECT "url", "sortOrder", "createdAt", "id"
      FROM "Image"
      WHERE "carId" = selected."carId"
      ORDER BY "sortOrder" ASC, "createdAt" ASC, "id" ASC
      LIMIT ${limit}
    ) AS image
    ORDER BY selected."carId", image."sortOrder", image."createdAt", image."id"
  `);
  const byCar = new Map<string, { url: string }[]>();
  for (const row of rows) {
    const images = byCar.get(row.carId) ?? [];
    images.push({ url: row.url });
    byCar.set(row.carId, images);
  }
  return cars.map((car) => ({ ...car, images: byCar.get(car.id) ?? [] }));
}
