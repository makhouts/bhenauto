"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { z } from "zod";
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET } from "@/lib/r2";
import { isR2Key } from "@/lib/image-url";

export async function toggleFeatured(id: string, featured: boolean) {
    await requireAdmin();
    try {
        await prisma.car.update({
            where: { id },
            data: { featured },
        });
        revalidatePath("/admin/cars");
        revalidatePath("/");
        revalidatePath("/inventory");
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle featured status:", error);
        return { error: "Failed to update car status." };
    }
}

export async function toggleSold(id: string, sold: boolean) {
    await requireAdmin();
    try {
        await prisma.car.update({
            where: { id },
            data: { sold },
        });
        revalidatePath("/admin/cars");
        revalidatePath(`/cars/${id}`);
        revalidatePath("/inventory");
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle sold status:", error);
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
            },
        });
        revalidatePath("/admin/cars");
        revalidatePath("/inventory");
        revalidatePath("/");
        return { success: true };
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
        if (car?.images?.length) {
            const r2Keys = car.images
                .map((img) => img.url)
                .filter(isR2Key);

            if (r2Keys.length > 0) {
                await r2Client.send(
                    new DeleteObjectsCommand({
                        Bucket: R2_BUCKET,
                        Delete: {
                            Objects: r2Keys.map((key) => ({ Key: key })),
                            Quiet: true,
                        },
                    })
                ).catch((err: Error) => {
                    console.warn("Failed to delete some R2 images:", err.message);
                });
            }
        }

        await prisma.car.delete({
            where: { id },
        });
        revalidatePath("/admin/cars");
        revalidatePath("/");
        revalidatePath("/inventory");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete car:", error);
        return { error: "Failed to delete car." };
    }
}

// ── Zod schema for strict car input validation ──

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
    // Accepts both R2 keys (e.g. "bhenauto/clxxx/img.webp") and legacy full URLs
    images: z.array(z.string().min(1)).min(0).max(50),
});

export async function saveCar(data: unknown) {
    await requireAdmin();
    try {
        const parsed = CarInputSchema.parse(data);
        const { id, images, carpass_url, ...carData } = parsed;

        const dbData = {
            ...carData,
            carpass_url: carpass_url || null,
        };

        if (id) {
            await prisma.car.update({
                where: { id },
                data: {
                    ...dbData,
                    images: {
                        deleteMany: {},
                        create: images.map((url: string) => ({ url })),
                    },
                },
            });
        } else {
            await prisma.car.create({
                data: {
                    ...dbData,
                    images: {
                        create: images.map((url: string) => ({ url })),
                    },
                },
            });
        }

        revalidatePath("/admin/cars");
        revalidatePath("/inventory");
        revalidatePath("/");

        return { success: true };
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
