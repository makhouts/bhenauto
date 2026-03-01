import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

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

        // Ensure the uploads directory exists
        const uploadDir = join(process.cwd(), "public/uploads");
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Directory might already exist, ignore error or log it
        }

        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Create a unique filename to prevent overwriting
            const uniqueSuffix = uuidv4();
            const originalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
            const filename = `${uniqueSuffix}-${originalName}`;

            const path = join(uploadDir, filename);

            await writeFile(path, buffer);

            // Store the relative URL suitable for saving in the database
            uploadedUrls.push(`/uploads/${filename}`);
        }

        return NextResponse.json({ urls: uploadedUrls });
    } catch (error) {
        console.error("Error uploading files:", error);
        return NextResponse.json(
            { error: "Internal server error during file upload." },
            { status: 500 }
        );
    }
}
