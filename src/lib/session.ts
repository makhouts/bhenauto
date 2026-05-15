const SESSION_CONTEXT = "bhenauto-admin-session-v1";
const SESSION_TTL_SECONDS = 60 * 60 * 2;

type SessionPayload = {
    v: 1;
    iat: number;
    exp: number;
    nonce: string;
};

function base64UrlEncode(bytes: Uint8Array): string {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function encodeText(value: string): Uint8Array {
    return new TextEncoder().encode(value);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function randomNonce(): string {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

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

async function sign(secret: string, value: string): Promise<string> {
    const key = await getHmacKey(secret);
    const signature = await globalThis.crypto.subtle.sign("HMAC", key, toArrayBuffer(encodeText(`${SESSION_CONTEXT}.${value}`)));
    return base64UrlEncode(new Uint8Array(signature));
}

/**
 * Creates a per-login signed session token with an embedded expiry.
 * The admin secret is never stored in the cookie.
 */
export async function createSessionToken(secret: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const payload: SessionPayload = {
        v: 1,
        iat: now,
        exp: now + SESSION_TTL_SECONDS,
        nonce: randomNonce(),
    };
    const payloadPart = base64UrlEncode(encodeText(JSON.stringify(payload)));
    const signaturePart = await sign(secret, payloadPart);
    return `${payloadPart}.${signaturePart}`;
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
        const [payloadPart, signaturePart] = sessionValue.split(".");
        if (!payloadPart || !signaturePart) return false;

        const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadPart))) as Partial<SessionPayload>;
        if (payload.v !== 1 || typeof payload.exp !== "number") return false;
        if (payload.exp <= Math.floor(Date.now() / 1000)) return false;

        const key = await getHmacKey(secret);
        return globalThis.crypto.subtle.verify(
            "HMAC",
            key,
            toArrayBuffer(base64UrlDecode(signaturePart)),
            toArrayBuffer(encodeText(`${SESSION_CONTEXT}.${payloadPart}`))
        );
    } catch {
        return false;
    }
}

export const ADMIN_SESSION_MAX_AGE = SESSION_TTL_SECONDS;
