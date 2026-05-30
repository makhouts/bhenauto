"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { revalidateLocalizedPath } from "@/lib/revalidate";
import { requireAdmin } from "@/lib/auth-guard";
import { z } from "zod";
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET } from "@/lib/r2";
import { getImageKeysForDeletion, isR2Key } from "@/lib/image-url";
import { reconcileCarImages } from "@/lib/cars/image-reconciliation";
import {
    cancelPendingAutoScoutSyncJobsForCar,
    enqueueAutoScoutSyncJob,
    processAutoScoutSyncJobs,
    type AutoScoutSyncJobAction,
} from "@/lib/autoscout24/sync-jobs";

function isAllowedCarImage(value: string): boolean {
    if (isR2Key(value)) return /^[a-zA-Z0-9/_-]+\.webp$/.test(value);
    try {
        const parsed = new URL(value);
        if (parsed.protocol !== "https:") return false;
        const allowedHosts = new Set(["images.bhenauto.com"]);
        const configuredPublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
        if (configuredPublicUrl) allowedHosts.add(new URL(configuredPublicUrl).hostname);
        return allowedHosts.has(parsed.hostname);
    } catch {
        return false;
    }
}

function expandImageKeysForDeletion(keys: string[]): string[] {
    const deleteSet = new Set<string>();
    for (const key of keys) {
        for (const keyToDelete of getImageKeysForDeletion(key)) {
            deleteSet.add(keyToDelete);
        }
    }
    return [...deleteSet];
}

async function deleteR2Keys(keys: string[]) {
    if (keys.length === 0) return;
    await r2Client.send(
        new DeleteObjectsCommand({
            Bucket: R2_BUCKET,
            Delete: {
                Objects: keys.map((key) => ({ Key: key })),
                Quiet: true,
            },
        })
    );
}

function runAfterResponse(label: string, task: () => Promise<void>) {
    after(async () => {
        try {
            await task();
            revalidatePath("/admin/cars");
            revalidateLocalizedPath("");
            revalidateLocalizedPath("/inventory");
        } catch (error) {
            console.error(`${label} failed:`, error);
        }
    });
}

function scheduleAutoScoutQueueProcessing() {
    runAfterResponse("AutoScout24 sync queue", async () => {
        await processAutoScoutSyncJobs({ limit: 5 });
    });
}

function scheduleR2Deletion(keys: string[]) {
    if (keys.length === 0) return;
    runAfterResponse("R2 background image cleanup", async () => {
        await deleteR2Keys(keys);
    });
}

export async function retryCarAutoscoutSync(id: string) {
    await requireAdmin();
    try {
        const car = await prisma.car.findUnique({
            where: { id },
            select: {
                id: true,
                sold: true,
                autoscoutListingId: true,
            },
        });

        if (!car) {
            return { error: "Vehicle not found." };
        }

        if (car.sold && !car.autoscoutListingId) {
            await prisma.car.update({
                where: { id },
                data: {
                    autoscoutSyncStatus: "deleted",
                    autoscoutSyncError: null,
                    publicationStatus: "Deleted from AutoScout24",
                },
            });
            revalidatePath("/admin/cars");
            return { success: true, autoscoutQueued: false, autoscoutSyncStatus: "deleted" };
        }

        const action: AutoScoutSyncJobAction = car.sold ? "delete" : "upsert";
        const autoscoutSyncStatus = car.sold ? "pending-delete" : "pending";
        await enqueueAutoScoutSyncJob({
            carId: id,
            action,
            resetAttempts: true,
        });

        scheduleAutoScoutQueueProcessing();

        revalidatePath("/admin/cars");
        return { success: true, autoscoutQueued: true, autoscoutSyncStatus };
    } catch (error) {
        console.error("Failed to retry AutoScout24 sync:", error);
        return { error: "Failed to retry AutoScout24 sync." };
    }
}

export async function toggleFeatured(id: string, featured: boolean) {
    await requireAdmin();
    try {
        await prisma.car.update({
            where: { id },
            data: { featured },
        });
        revalidatePath("/admin/cars");
        revalidateLocalizedPath("");
        revalidateLocalizedPath("/inventory");
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle featured status:", error);
        return { error: "Failed to update car status." };
    }
}

export async function updateCarStatus(id: string, status: "beschikbaar" | "gereserveerd" | "verkocht") {
    await requireAdmin();
    try {
        await prisma.car.update({
            where: { id },
            data: {
                sold: status === "verkocht",
                reserved: status === "gereserveerd",
                soldAt: status === "verkocht" ? new Date() : null,
                autoscoutSyncStatus: status === "verkocht" ? "pending-delete" : "pending",
                autoscoutSyncError: null,
            },
        });

        const action: AutoScoutSyncJobAction = status === "verkocht"
            ? "delete"
            : "set-publication";
        await enqueueAutoScoutSyncJob({
            carId: id,
            action,
        });
        scheduleAutoScoutQueueProcessing();

        revalidatePath("/admin/cars");
        revalidateLocalizedPath("/inventory");
        revalidateLocalizedPath("");
        return { success: true, autoscoutQueued: true };
    } catch (error) {
        console.error("Failed to update car status:", error);
        return { error: "Failed to update car status." };
    }
}

export async function deleteCar(id: string) {
    await requireAdmin();
    try {
        const car = await prisma.car.findUnique({
            where: { id },
            include: { images: true },
        });

        // Delete all images from R2
        const r2Keys = car?.images
            ?.map((img) => img.url)
            .filter(isR2Key) ?? [];
        const keysToDelete = expandImageKeysForDeletion(r2Keys);

        await cancelPendingAutoScoutSyncJobsForCar(
            id,
            "Vehicle deleted from the BhenAuto database.",
        );

        await prisma.car.delete({
            where: { id },
        });

        if (car?.images?.length) {
            scheduleR2Deletion(keysToDelete);
        }
        if (car) {
            await enqueueAutoScoutSyncJob({
                carId: id,
                action: "delete",
                customerId: car.autoscoutCustomerId,
                listingId: car.autoscoutListingId,
                crossReferenceId: car.crossReferenceId ?? car.id.slice(0, 50),
                resetAttempts: true,
            });
            scheduleAutoScoutQueueProcessing();
        }

        revalidatePath("/admin/cars");
        revalidateLocalizedPath("");
        revalidateLocalizedPath("/inventory");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete car:", error);
        return { error: "Failed to delete car." };
    }
}

// ── Zod schema for strict car input validation ──

const optionalString = (max = 200) => z.preprocess((value) => {
    if (typeof value !== "string") return value ?? null;
    const trimmed = value.trim();
    return trimmed || null;
}, z.string().max(max).nullable().optional());

const optionalInt = z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return null;
    return value;
}, z.coerce.number().int().nullable().optional());

const optionalNumber = z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return null;
    return value;
}, z.coerce.number().nullable().optional());

const CarInputSchema = z.object({
    id: z.string().optional(),
    slug: z.string().min(1).max(300).regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and dashes"),
    title: z.string().min(1).max(300),
    brand: z.string().min(1).max(100),
    model: z.string().min(1).max(100),
    year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 2),
    mileage: z.coerce.number().int().min(0),
    price: z.coerce.number().min(0),
    horsepower: z.coerce.number().int().min(0),
    fuel_type: z.string().min(1).max(50),
    transmission: z.string().min(1).max(50),
    color: z.string().min(1).max(50),
    description: z.string().max(10000),
    featured: z.boolean().optional().default(false),
    sold: z.boolean().optional().default(false),
    reserved: z.boolean().optional().default(false),
    carpass_url: z.string().url().optional().or(z.literal("")).nullable(),
    features: z.array(z.string().max(200)).optional().default([]),
    equipmentCodes: z.array(z.string().max(20)).optional().default([]),
    makeCode: optionalString(20),
    modelCode: optionalString(20),
    offerTypeCode: optionalString(20),
    availabilityTypeCode: optionalString(20),
    vin: optionalString(17),
    referenceNumber: optionalString(50),
    crossReferenceId: optionalString(50),
    licencePlate: optionalString(10),
    version: optionalString(121),
    bodyTypeCode: optionalString(20),
    vehicleTypeCode: optionalString(20),
    fuelTypeCode: optionalString(20),
    fuelCategory: optionalString(20),
    transmissionCode: optionalString(20),
    drivetrainCode: optionalString(20),
    powerKw: optionalInt,
    engineSize: optionalInt,
    cylinderCount: optionalInt,
    firstRegistrationRaw: optionalString(7),
    constructionYear: optionalInt,
    doors: optionalInt,
    seats: optionalInt,
    exteriorColorCode: optionalString(20),
    manufacturerColorName: optionalString(30),
    interiorColorCode: optionalString(20),
    upholsteryCode: optionalString(20),
    emissionClassCode: optionalString(20),
    co2Emissions: optionalInt,
    consumptionCombined: optionalNumber,
    priceCurrency: z.string().min(3).max(3).optional().default("EUR"),
    netPrice: optionalInt,
    vatRate: optionalNumber,
    vatDeductible: z.boolean().optional().default(false),
    priceNegotiable: z.boolean().optional().default(false),
    warrantyMonths: optionalInt,
    hasWarranty: z.boolean().optional().default(false),
    syncWithAutoscout: z.boolean().optional().default(true),
    // Accepts both R2 keys (e.g. "bhenauto/clxxx/img.webp") and legacy full URLs
    images: z.array(z.string().min(1).refine(isAllowedCarImage, "Image must be a BhenAuto R2 key or approved CDN URL")).min(0).max(50),
});

export async function saveCar(data: unknown) {
    await requireAdmin();
    try {
        const parsed = CarInputSchema.parse(data);
        const { id, images, carpass_url, syncWithAutoscout, ...carData } = parsed;

        const dbData = {
            ...carData,
            carpass_url: carpass_url || null,
            equipment: carData.equipmentCodes.length > 0
                ? { codes: carData.equipmentCodes, labels: carData.features }
                : Prisma.JsonNull,
        };
        const syncAction: AutoScoutSyncJobAction = carData.sold ? "delete" : "upsert";
        const pendingSyncStatus = syncAction === "delete" ? "pending-delete" : "pending";

        let savedCarId = id;

        if (id) {
            const existingImages = await prisma.image.findMany({
                where: { carId: id },
                select: { id: true, url: true, sortOrder: true },
            });
            const imagePlan = reconcileCarImages(existingImages, images);
            const removedR2Keys = imagePlan.removedUrls.filter(isR2Key);

            await prisma.$transaction([
                prisma.car.update({
                    where: { id },
                    data: {
                        ...dbData,
                        sourceOfTruth: "website",
                        autoscoutSyncStatus: syncWithAutoscout ? pendingSyncStatus : "skipped",
                        autoscoutSyncError: null,
                    },
                }),
                ...imagePlan.updates.map((image) => prisma.image.update({
                    where: { id: image.id },
                    data: { sortOrder: image.sortOrder },
                })),
                ...(imagePlan.deleteIds.length > 0 ? [
                    prisma.image.deleteMany({
                        where: { id: { in: imagePlan.deleteIds } },
                    }),
                ] : []),
                ...(imagePlan.creates.length > 0 ? [
                    prisma.image.createMany({
                        data: imagePlan.creates.map((image) => ({
                            carId: id,
                            url: image.url,
                            sortOrder: image.sortOrder,
                        })),
                    }),
                ] : []),
            ]);

            if (removedR2Keys.length > 0) {
                const keysToDelete = expandImageKeysForDeletion(removedR2Keys);
                scheduleR2Deletion(keysToDelete);
            }
        } else {
            const created = await prisma.car.create({
                data: {
                    ...dbData,
                    sourceOfTruth: "website",
                    autoscoutSyncStatus: syncWithAutoscout ? pendingSyncStatus : "skipped",
                    autoscoutSyncError: null,
                    images: {
                        create: images.map((url: string, index: number) => ({ url, sortOrder: index })),
                    },
                },
            });
            savedCarId = created.id;
        }

        if (savedCarId && syncWithAutoscout) {
            await enqueueAutoScoutSyncJob({
                carId: savedCarId,
                action: syncAction,
                resetAttempts: true,
            });
            scheduleAutoScoutQueueProcessing();
        } else if (savedCarId) {
            await cancelPendingAutoScoutSyncJobsForCar(savedCarId);
        }

        revalidatePath("/admin/cars");
        revalidateLocalizedPath("/inventory");
        revalidateLocalizedPath("");

        return { success: true, autoscoutQueued: Boolean(savedCarId && syncWithAutoscout) };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const firstIssue = error.issues[0];
            console.error("Car validation failed:", firstIssue);
            return { error: `Validatiefout: ${firstIssue.path.join(".")} — ${firstIssue.message}` };
        }
        console.error("Failed to save car:", error);
        return { error: "An error occurred while saving the car." };
    }
}
