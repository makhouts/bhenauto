const SESSION_CONTEXT = "bhenauto-admin-session-v1";

async function getHmacKey(secret: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    return globalThis.crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
    );
}

/**
 * Derives a session token from the admin secret using HMAC-SHA256.
 * The raw secret is never stored in the cookie — only this derived token is.
 */
export async function deriveSessionToken(secret: string): Promise<string> {
    const key = await getHmacKey(secret);
    const enc = new TextEncoder();
    const signature = await globalThis.crypto.subtle.sign("HMAC", key, enc.encode(SESSION_CONTEXT));
    return Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

/**
 * Validates a session cookie value using timing-safe comparison via HMAC verify.
 * Returns true only if the value matches the HMAC-derived token.
 */
export async function isValidSession(sessionValue: string | undefined): Promise<boolean> {
    if (!sessionValue) return false;
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) return false;
    try {
        const key = await getHmacKey(secret);
        const enc = new TextEncoder();
        // Decode hex string back to bytes
        const sessionBytes = new Uint8Array(
            (sessionValue.match(/.{1,2}/g) ?? []).map((b) => parseInt(b, 16))
        );
        return globalThis.crypto.subtle.verify("HMAC", key, sessionBytes, enc.encode(SESSION_CONTEXT));
    } catch {
        return false;
    }
}
