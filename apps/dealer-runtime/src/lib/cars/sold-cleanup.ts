import prisma from "@/lib/prisma";
import { deleteR2ObjectsForImageUrls } from "@/lib/autoscout24/images";

const DEFAULT_RETENTION_DAYS = 2;

export type SoldCarCleanupOptions = {
  apply?: boolean;
  retentionDays?: number;
  now?: Date;
};

export type SoldCarCleanupSummary = {
  mode: "dry-run" | "apply";
  retentionDays: number;
  cutoff: Date;
  carsMatched: number;
  carsDeleted: number;
  imagesDeleted: number;
  actions: string[];
};

export async function cleanupSoldCars(options: SoldCarCleanupOptions = {}): Promise<SoldCarCleanupSummary> {
  const retentionDays = options.retentionDays ?? DEFAULT_RETENTION_DAYS;
  const now = options.now ?? new Date();
  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
  const cars = await prisma.car.findMany({
    where: {
      sold: true,
      soldAt: { lte: cutoff },
    },
    include: { images: true },
  });

  const summary: SoldCarCleanupSummary = {
    mode: options.apply ? "apply" : "dry-run",
    retentionDays,
    cutoff,
    carsMatched: cars.length,
    carsDeleted: 0,
    imagesDeleted: 0,
    actions: cars.map((car) => `delete sold car ${car.id} (${car.title})`),
  };

  if (!options.apply || cars.length === 0) return summary;

  summary.imagesDeleted = await deleteR2ObjectsForImageUrls(
    cars.flatMap((car) => car.images.map((image) => image.url)),
  );
  await prisma.car.deleteMany({ where: { id: { in: cars.map((car) => car.id) } } });
  summary.carsDeleted = cars.length;

  return summary;
}
