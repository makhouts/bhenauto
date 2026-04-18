import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET } from "@/lib/r2";
import { optimizeImage } from "@/lib/image-optimize";
import { isValidSession } from "@/lib/session";
import { v4 as uuidv4 } from "uuid";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file (before optimization)
const MAX_FILES = 20;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/jpg"];

// Client ID for the R2 key prefix (multi-tenant structure)
const CLIENT_ID = "bhenauto";

// Simple in-memory rate limiter (per-process; for production use Redis/Upstash)
const uploadRateLimit = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 upload requests per minute per IP

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const timestamps = uploadRateLimit.get(ip)?.filter((t) => now - t < RATE_LIMIT_WINDOW_MS) ?? [];
    if (timestamps.length >= RATE_LIMIT_MAX) return true;
    timestamps.push(now);
    uploadRateLimit.set(ip, timestamps);
    return false;
}

/**
 * Generate a unique, deterministic R2 key for an image.
 * Format: bhenauto/{carId}/{uniqueId}.webp
 */
function generateKey(carId: string): string {
    const id = uuidv4();
    return `${CLIENT_ID}/${carId}/${id}.webp`;
}

export async function POST(request: NextRequest) {
    try {
        // Auth check — defence-in-depth (middleware also guards this route)
        const sessionCookie = request.cookies.get("admin_session")?.value;
        if (!await isValidSession(sessionCookie)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate limiting
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        if (isRateLimited(ip)) {
            return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
        }

        const formData = await request.formData();
        const files = formData.getAll("files") as File[];
        const carId = formData.get("carId") as string;

        if (!carId) {
            return NextResponse.json(
                { error: "carId is required." },
                { status: 400 }
            );
        }

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: "No files received." },
                { status: 400 }
            );
        }

        if (files.length > MAX_FILES) {
            return NextResponse.json(
                { error: `Maximum ${MAX_FILES} files allowed per upload.` },
                { status: 400 }
            );
        }

        // Validate all files before uploading any
        for (const file of files) {
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json(
                    { error: `File "${file.name}" exceeds the 10MB size limit.` },
                    { status: 400 }
                );
            }
            if (!ALLOWED_TYPES.includes(file.type)) {
                return NextResponse.json(
                    { error: `File type "${file.type}" is not allowed. Use JPEG, PNG, or WebP.` },
                    { status: 400 }
                );
            }
        }

        // Optimize and upload all images in parallel
        // Note: sharp validates actual image content during optimization,
        // rejecting files that claim to be images but aren't.
        const uploadedKeys = await Promise.all(
            files.map(async (file) => {
                const bytes = await file.arrayBuffer();
                const rawBuffer = Buffer.from(bytes);

                // Optimize: resize to max 1600px width, convert to WebP
                // This also serves as content-based validation — sharp will throw
                // if the buffer is not a valid image, regardless of declared MIME type.
                const optimized = await optimizeImage(rawBuffer);

                const key = generateKey(carId);

                await r2Client.send(
                    new PutObjectCommand({
                        Bucket: R2_BUCKET,
                        Key: key,
                        Body: optimized,
                        ContentType: "image/webp",
                        CacheControl: "public, max-age=31536000, immutable",
                    })
                );

                return key;
            })
        );

        return NextResponse.json({ keys: uploadedKeys });
    } catch (error: unknown) {
        console.error("Upload error:", error instanceof Error ? error.message : "unknown error");
        return NextResponse.json(
            { error: "Failed to upload images." },
            { status: 500 }
        );
    }
}
