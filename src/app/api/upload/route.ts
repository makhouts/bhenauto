import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: "No files received." },
                { status: 400 }
            );
        }

        const uploadedUrls: string[] = [];

        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Convert buffer to base64 data URI for Cloudinary upload
            const base64 = buffer.toString("base64");
            const dataUri = `data:${file.type || "image/jpeg"};base64,${base64}`;

            const result = await cloudinary.uploader.upload(dataUri, {
                folder: "bhenauto",
                asset_folder: "bhenauto",
                resource_type: "image",
            });

            uploadedUrls.push(result.secure_url);
        }

        return NextResponse.json({ urls: uploadedUrls });
    } catch (error: any) {
        console.error("Cloudinary upload error:", error?.message || error);
        return NextResponse.json(
            { error: error?.message || "Failed to upload images." },
            { status: 500 }
        );
    }
}
