import prisma from "@/lib/prisma";

export function getCarSyncStatuses(ids: string[]) {
  return prisma.car.findMany({
    where: { id: { in: ids } },
    select: {
      id: true, sold: true, reserved: true, sourceOfTruth: true,
      autoscoutListingId: true, autoscoutSyncStatus: true, autoscoutSyncError: true,
    },
  });
}
