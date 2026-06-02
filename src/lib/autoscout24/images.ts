import { createHash } from "crypto";
import { DeleteObjectsCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET } from "@/lib/r2";
import { optimizeCarImageVariants } from "@/lib/image-optimize";
import { getImageKeysForDeletion, getImageVariantKey, isR2Key } from "@/lib/image-url";
import type { AutoScoutMappedImage } from "./types";

const IMPORT_CLIENT_ID = "bhenauto";
const IMAGE_TIMEOUT_MS = 15_000;
const IMAGE_RETRY_DELAYS_MS = [150, 350, 800];
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "image";
}

function imageKey(listingId: string, image: AutoScoutMappedImage) {
  const imageId = image.autoscoutImageId ?? createHash("sha1").update(image.sourceUrl).digest("hex").slice(0, 16);
  const prefix = `${IMPORT_CLIENT_ID}/autoscout24/${sanitizeSegment(listingId)}`;
  const order = String(image.sortOrder + 1).padStart(2, "0");
  return `${prefix}/${order}-${sanitizeSegment(imageId)}.webp`;
}

function validateAutoScoutImageUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:") {
    throw new Error("AutoScout24 image URL must use HTTPS");
  }
  if (url.hostname !== "prod.pictures.autoscout24.net" && !url.hostname.endsWith(".pictures.autoscout24.net")) {
    throw new Error(`AutoScout24 image URL has unsupported host: ${url.hostname}`);
  }
  return url.toString();
}

async function readImageBody(response: Response) {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
    throw new Error(`Image download exceeds ${MAX_IMAGE_BYTES} bytes`);
  }
  if (!response.body) {
    throw new Error("Image download returned an empty body");
  }

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_IMAGE_BYTES) {
      await reader.cancel();
      throw new Error(`Image download exceeds ${MAX_IMAGE_BYTES} bytes`);
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks, totalBytes);
}

async function downloadImage(url: string): Promise<Buffer> {
  const validatedUrl = validateAutoScoutImageUrl(url);
  let lastError: unknown;

  for (let attempt = 0; attempt <= IMAGE_RETRY_DELAYS_MS.length; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);

    try {
      const response = await fetch(validatedUrl, {
        headers: { Accept: "image/avif,image/webp,image/jpeg,image/png,*/*" },
        redirect: "error",
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Image download failed with HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType && !contentType.startsWith("image/")) {
        throw new Error(`Image URL returned unsupported content type: ${contentType}`);
      }

      return readImageBody(response);
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt >= IMAGE_RETRY_DELAYS_MS.length) break;
      await sleep(IMAGE_RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Image download failed");
}

export async function importAutoScoutImageToR2(
  listingId: string,
  image: AutoScoutMappedImage,
): Promise<string> {
  const key = imageKey(listingId, image);
  const thumbKey = getImageVariantKey(key, "thumb");
  const galleryKey = getImageVariantKey(key, "gallery");
  const lightboxKey = getImageVariantKey(key, "lightbox");

  if (!thumbKey || !galleryKey || !lightboxKey) {
    throw new Error(`Could not derive image variant keys for ${key}`);
  }

  const rawBuffer = await downloadImage(image.sourceUrl);
  const variants = await optimizeCarImageVariants(rawBuffer);
  const objects = [
    { key, body: variants.source },
    { key: thumbKey, body: variants.thumb },
    { key: galleryKey, body: variants.gallery },
    { key: lightboxKey, body: variants.lightbox },
  ];

  await Promise.all(objects.map(({ key: objectKey, body }) =>
    r2Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: objectKey,
      Body: body,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }))
  ));

  return key;
}

export async function deleteR2ObjectsForImageUrls(urls: string[]): Promise<number> {
  const keys = new Set<string>();

  for (const url of urls) {
    if (!isR2Key(url)) continue;
    for (const key of getImageKeysForDeletion(url)) keys.add(key);
  }

  const allKeys = [...keys];
  for (let i = 0; i < allKeys.length; i += 1000) {
    const batch = allKeys.slice(i, i + 1000);
    if (batch.length === 0) continue;
    await r2Client.send(new DeleteObjectsCommand({
      Bucket: R2_BUCKET,
      Delete: {
        Objects: batch.map((Key) => ({ Key })),
        Quiet: true,
      },
    }));
  }

  return allKeys.length;
}
