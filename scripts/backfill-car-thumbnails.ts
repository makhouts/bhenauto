import "dotenv/config";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import prisma from "../src/lib/prisma";
import { optimizeCarImageVariants } from "../src/lib/image-optimize";
import { getImageVariantKey, isImageVariantKey, isR2Key, type ImageVariant } from "../src/lib/image-url";
import { R2_BUCKET, r2Client } from "../src/lib/r2";

const PUBLIC_VARIANTS: ImageVariant[] = ["thumb", "gallery", "lightbox"];

async function main() {
    const cars = await prisma.car.findMany({
        select: {
            images: {
                orderBy: { createdAt: "asc" },
                select: { url: true },
            },
        },
    });

    let processed = 0;
    let variantsWritten = 0;
    let skipped = 0;
    let failed = 0;

    const imageKeys = [...new Set(cars.flatMap((car) => car.images.map((image) => image.url)))]
        .filter(isR2Key)
        .filter((key) => !isImageVariantKey(key));

    for (const sourceKey of imageKeys) {
        try {
            const variantKeys = PUBLIC_VARIANTS.map((variant) => ({
                variant,
                key: getImageVariantKey(sourceKey, variant),
            }));

            if (variantKeys.some(({ key }) => !key)) {
                skipped++;
                continue;
            }

            const sourceObject = await r2Client.send(
                new GetObjectCommand({
                    Bucket: R2_BUCKET,
                    Key: sourceKey,
                })
            );

            const body = sourceObject.Body;
            if (!body) {
                console.warn(`Skipping ${sourceKey}: source body missing.`);
                failed++;
                continue;
            }

            const bytes = await body.transformToByteArray();
            const variants = await optimizeCarImageVariants(Buffer.from(bytes));

            await Promise.all(variantKeys.map(({ variant, key }) =>
                r2Client.send(new PutObjectCommand({
                    Bucket: R2_BUCKET,
                    Key: key!,
                    Body: variants[variant],
                    ContentType: "image/webp",
                    CacheControl: "public, max-age=31536000, immutable",
                }))
            ));

            processed++;
            variantsWritten += PUBLIC_VARIANTS.length;
        } catch (error) {
            failed++;
            console.warn(`Failed to backfill image variants for ${sourceKey}:`, error);
        }
    }

    console.log(`Image variant backfill complete. processed=${processed} variantsWritten=${variantsWritten} skipped=${skipped} failed=${failed}`);
}

main()
    .catch((error) => {
        console.error("Thumbnail backfill failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
