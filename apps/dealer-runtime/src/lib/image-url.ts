/**
 * Resolves an image reference (R2 key or full URL) to a full URL.
 *
 * - If the value starts with "http", it's already a full URL and is returned as-is.
 * - Otherwise it's treated as an R2 object key, and the public R2 CDN URL is prepended.
 *
 * Runs both server-side and client-side via NEXT_PUBLIC_R2_PUBLIC_URL.
 */

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";
const IMAGE_VARIANT_SUFFIXES = {
    thumb: "__thumb",
    gallery: "__gallery",
    lightbox: "__lightbox",
} as const;

export type ImageVariant = keyof typeof IMAGE_VARIANT_SUFFIXES;

export function getImageUrl(urlOrKey: string): string {
    if (!urlOrKey) return "";

    // Already a full URL → return as-is
    if (urlOrKey.startsWith("http://") || urlOrKey.startsWith("https://")) {
        return urlOrKey;
    }

    // R2 key → construct full CDN URL
    return `${R2_PUBLIC_URL}/${urlOrKey}`;
}

/**
 * Returns true if the value is an R2 key (not a full URL).
 */
export function isR2Key(urlOrKey: string): boolean {
    return !!urlOrKey && !urlOrKey.startsWith("http://") && !urlOrKey.startsWith("https://");
}

export function getImageVariantKey(urlOrKey: string, variant: ImageVariant): string | null {
    if (!isR2Key(urlOrKey) || !urlOrKey.endsWith(".webp")) return null;
    if (isImageVariantKey(urlOrKey)) return urlOrKey;
    return urlOrKey.replace(/\.webp$/, `${IMAGE_VARIANT_SUFFIXES[variant]}.webp`);
}

export function getImageVariantUrl(urlOrKey: string, variant: ImageVariant): string {
    const variantKey = getImageVariantKey(urlOrKey, variant);
    return getImageUrl(variantKey ?? urlOrKey);
}

export function isImageVariantKey(urlOrKey: string): boolean {
    return Object.values(IMAGE_VARIANT_SUFFIXES).some((suffix) => urlOrKey.endsWith(`${suffix}.webp`));
}

export function getImageKeysForDeletion(urlOrKey: string): string[] {
    if (!isR2Key(urlOrKey)) return [];

    const keys = new Set<string>([urlOrKey]);

    if (!isImageVariantKey(urlOrKey)) {
        for (const variant of Object.keys(IMAGE_VARIANT_SUFFIXES) as ImageVariant[]) {
            const variantKey = getImageVariantKey(urlOrKey, variant);
            if (variantKey) keys.add(variantKey);
        }
    }

    return [...keys];
}

export function getThumbnailKey(urlOrKey: string): string | null {
    return getImageVariantKey(urlOrKey, "thumb");
}

export function getThumbnailImageUrl(urlOrKey: string): string {
    return getImageVariantUrl(urlOrKey, "thumb");
}
