import "dotenv/config";
import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import prisma from "../src/lib/prisma";
import { optimizeThumbnail } from "../src/lib/image-optimize";
import { getThumbnailKey, isR2Key } from "../src/lib/image-url";
import { R2_BUCKET, r2Client } from "../src/lib/r2";

async function main() {
    const cars = await prisma.car.findMany({
        select: {
            images: {
                orderBy: { createdAt: "asc" },
                select: { url: true },
            },
        },
    });

    let created = 0;
    let deleted = 0;
    let skipped = 0;
    let failed = 0;

    for (const car of cars) {
        const imageKeys = car.images.map((image) => image.url);
        const r2ImageKeys = imageKeys.filter(isR2Key);
        const coverKey = imageKeys[0] && isR2Key(imageKeys[0]) ? imageKeys[0] : null;
        const coverThumbnailKey = coverKey ? getThumbnailKey(coverKey) : null;
        const staleThumbnailKeys = r2ImageKeys
            .map((key) => getThumbnailKey(key))
            .filter((key): key is string => Boolean(key))
            .filter((key) => key !== coverThumbnailKey);

        try {
            if (staleThumbnailKeys.length > 0) {
                await r2Client.send(
                    new DeleteObjectsCommand({
                        Bucket: R2_BUCKET,
                        Delete: {
                            Objects: [...new Set(staleThumbnailKeys)].map((key) => ({ Key: key })),
                            Quiet: true,
                        },
                    })
                );
                deleted += [...new Set(staleThumbnailKeys)].length;
            }

            if (!coverKey || !coverThumbnailKey) {
                skipped++;
                continue;
            }

            const sourceObject = await r2Client.send(
                new GetObjectCommand({
                    Bucket: R2_BUCKET,
                    Key: coverKey,
                })
            );

            const body = sourceObject.Body;
            if (!body) {
                console.warn(`Skipping ${coverKey}: source body missing.`);
                failed++;
                continue;
            }

            const bytes = await body.transformToByteArray();
            const thumbnail = await optimizeThumbnail(Buffer.from(bytes));

            await r2Client.send(
                new PutObjectCommand({
                    Bucket: R2_BUCKET,
                    Key: coverThumbnailKey,
                    Body: thumbnail,
                    ContentType: "image/webp",
                    CacheControl: "public, max-age=31536000, immutable",
                })
            );

            created++;
        } catch (error) {
            failed++;
            console.warn(`Failed to backfill cover thumbnail for ${coverKey ?? "unknown cover"}:`, error);
        }
    }

    console.log(`Cover thumbnail backfill complete. created=${created} deleted=${deleted} skipped=${skipped} failed=${failed}`);
}

main()
    .catch((error) => {
        console.error("Thumbnail backfill failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
