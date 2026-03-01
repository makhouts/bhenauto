"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleFeatured(id: string, featured: boolean) {
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
    try {
        await prisma.car.update({
            where: { id },
            data: { sold },
        });
        revalidatePath("/admin/cars");
        revalidatePath(`/cars/${id}`); // We don't have slug easily here without querying, but we can revalidate all
        revalidatePath("/inventory");
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle sold status:", error);
        return { error: "Failed to update car status." };
    }
}

export async function deleteCar(id: string) {
    try {
        // Note: In a real app we'd also delete images from the filesystem or cloud storage
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

export async function saveCar(data: any) {
    try {
        const { id, images, ...carData } = data;

        // Parse numeric fields
        const parsedData = {
            ...carData,
            year: parseInt(carData.year),
            mileage: parseInt(carData.mileage),
            price: parseFloat(carData.price),
            horsepower: parseInt(carData.horsepower),
        };

        if (id) {
            // Update existing
            await prisma.car.update({
                where: { id },
                data: {
                    ...parsedData,
                    images: {
                        deleteMany: {}, // Clear old images
                        create: images.map((url: string) => ({ url })) // Add new images
                    }
                }
            });
        } else {
            // Create new
            await prisma.car.create({
                data: {
                    ...parsedData,
                    images: {
                        create: images.map((url: string) => ({ url }))
                    }
                }
            });
        }

        revalidatePath("/admin/cars");
        revalidatePath("/inventory");
        revalidatePath("/");

        return { success: true };
    } catch (error) {
        console.error("Failed to save car:", error);
        return { error: "An error occurred while saving the car." };
    }
}
