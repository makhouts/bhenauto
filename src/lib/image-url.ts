/**
 * Resolves an image reference (R2 key or full URL) to a full URL.
 *
 * - If the value starts with "http", it's already a full URL and is returned as-is.
 * - Otherwise it's treated as an R2 object key, and the public R2 CDN URL is prepended.
 *
 * Runs both server-side and client-side via NEXT_PUBLIC_R2_PUBLIC_URL.
 */

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";

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
