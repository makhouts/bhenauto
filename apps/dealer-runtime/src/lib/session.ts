import { DEFAULT_TENANT_BOOTSTRAP } from "@/lib/tenant-bootstrap";
import {
    createSessionToken as createScopedSessionToken,
    isValidSession as isValidScopedSession,
    SESSION_MAX_AGE,
} from "../../../../packages/core/src/auth/session";

const SESSION_CONTEXT = DEFAULT_TENANT_BOOTSTRAP.sessionContext;

/**
 * Creates a per-login signed session token with an embedded expiry.
 * The admin secret is never stored in the cookie.
 */
export async function createSessionToken(secret: string): Promise<string> {
    return createScopedSessionToken(secret, SESSION_CONTEXT);
}

/**
 * Validates a session cookie value using timing-safe comparison via HMAC verify.
 * Returns true only if the value matches the HMAC-derived token.
 */
export async function isValidSession(sessionValue: string | undefined): Promise<boolean> {
    return isValidScopedSession(sessionValue, process.env.ADMIN_SESSION_SECRET, SESSION_CONTEXT);
}

export const ADMIN_SESSION_MAX_AGE = SESSION_MAX_AGE;
