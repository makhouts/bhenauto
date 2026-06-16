import sharp from "sharp";
import prisma from "@/lib/prisma";
import { getImageUrl } from "@/lib/image-url";
import type { AutoScoutClient } from "./client";
import type { AutoScoutSyncImageInput } from "./push-mapper";

const AUTOSCOUT_IMAGE_MAX_WIDTH = 2000;
const AUTOSCOUT_IMAGE_JPEG_QUALITY = 90;

async function downloadImageBuffer(urlOrKey: string) {
  const response = await fetch(getImageUrl(urlOrKey));
  if (!response.ok) {
    throw new Error(`Afbeelding kon niet worden opgehaald voor AutoScout24: HTTP ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function toAutoScoutJpeg(buffer: Buffer) {
  return sharp(buffer)
    .rotate()
    .resize({
      width: AUTOSCOUT_IMAGE_MAX_WIDTH,
      withoutEnlargement: true,
      fit: "inside",
    })
    .jpeg({ quality: AUTOSCOUT_IMAGE_JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
}

export async function ensureAutoScoutImageIds(input: {
  client: AutoScoutClient;
  customerId: string;
  images: AutoScoutSyncImageInput[];
}) {
  const imageIds: string[] = [];

  for (const image of input.images.sort((a, b) => a.sortOrder - b.sortOrder)) {
    if (image.autoscoutImageId) {
      imageIds.push(image.autoscoutImageId);
      continue;
    }

    const source = await downloadImageBuffer(image.url);
    const jpeg = await toAutoScoutJpeg(source);
    const uploaded = await input.client.uploadImage(input.customerId, jpeg, "image/jpeg");

    await prisma.image.update({
      where: { id: image.id },
      data: {
        autoscoutImageId: uploaded.id,
        sourceMd5: uploaded.md5 ?? null,
      },
    });

    imageIds.push(uploaded.id);
  }

  return imageIds;
}
