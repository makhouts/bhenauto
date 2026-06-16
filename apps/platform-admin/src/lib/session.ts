import {
  SESSION_MAX_AGE,
  createSessionToken,
  isValidSession,
} from "@core/auth/session";

export const PLATFORM_ADMIN_SESSION_COOKIE = "platform_admin_session";
const PLATFORM_ADMIN_SESSION_CONTEXT = "platform-admin-session-v1";

export const PLATFORM_ADMIN_SESSION_MAX_AGE = SESSION_MAX_AGE;

export function createPlatformSessionToken(secret: string) {
  return createSessionToken(secret, PLATFORM_ADMIN_SESSION_CONTEXT);
}

export function isValidPlatformSession(sessionValue: string | undefined) {
  return isValidSession(
    sessionValue,
    process.env.ADMIN_SESSION_SECRET,
    PLATFORM_ADMIN_SESSION_CONTEXT,
  );
}
