import sharp from "sharp";

const MAX_WIDTH = 1600;
const WEBP_QUALITY = 82;

/**
 * Optimizes an image buffer for web delivery:
 * - Resizes to max 1600px width (maintains aspect ratio)
 * - Converts to WebP at quality 82
 * - Strips metadata (EXIF, etc.)
 *
 * Returns the optimized WebP buffer.
 */
export async function optimizeImage(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
        .rotate()             // Auto-rotate based on EXIF orientation
        .resize({
            width: MAX_WIDTH,
            withoutEnlargement: true, // Don't upscale small images
            fit: "inside",
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
}
