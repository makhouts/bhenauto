import sharp from "sharp";
import type { ImageVariant } from "@/lib/image-url";

const SOURCE_MAX_WIDTH = 2000;
const SOURCE_WEBP_QUALITY = 85;

const VARIANT_CONFIG: Record<ImageVariant, { width: number; quality: number }> = {
    // Large enough for side previews on high-DPR displays, still much smaller than gallery images.
    thumb: { width: 640, quality: 62 },
    gallery: { width: 1200, quality: 78 },
    lightbox: { width: 1800, quality: 82 },
};

async function optimizeWebp(buffer: Buffer, width: number, quality: number): Promise<Buffer> {
    return sharp(buffer)
        .rotate()             // Auto-rotate based on EXIF orientation
        .resize({
            width,
            withoutEnlargement: true, // Don't upscale small images
            fit: "inside",
        })
        .webp({ quality })
        .toBuffer();
}

/**
 * Optimizes an image buffer for web delivery:
 * - Resizes to max 2000px width (maintains aspect ratio)
 * - Converts to WebP at quality 85
 * - Strips metadata (EXIF, etc.)
 *
 * Returns the normalized source WebP buffer. Public pages should use variants.
 */
export async function optimizeImage(buffer: Buffer): Promise<Buffer> {
    return optimizeWebp(buffer, SOURCE_MAX_WIDTH, SOURCE_WEBP_QUALITY);
}

export async function optimizeImageVariant(buffer: Buffer, variant: ImageVariant): Promise<Buffer> {
    const config = VARIANT_CONFIG[variant];
    return optimizeWebp(buffer, config.width, config.quality);
}

export async function optimizeThumbnail(buffer: Buffer): Promise<Buffer> {
    return optimizeImageVariant(buffer, "thumb");
}

export async function optimizeCarImageVariants(buffer: Buffer): Promise<Record<"source" | ImageVariant, Buffer>> {
    // Generate sequentially to keep peak memory bounded during multi-file uploads.
    const source = await optimizeImage(buffer);
    const thumb = await optimizeImageVariant(buffer, "thumb");
    const gallery = await optimizeImageVariant(buffer, "gallery");
    const lightbox = await optimizeImageVariant(buffer, "lightbox");

    return { source, thumb, gallery, lightbox };
}
