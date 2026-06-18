import { createHash, timingSafeEqual } from "crypto";

const WORKSHOP_SCREEN_TOKEN = process.env.WORKSHOP_SCREEN_TOKEN?.trim() ?? "";

function sha256(value: string) {
    return createHash("sha256").update(value).digest();
}

export function hasWorkshopAccessToken() {
    return WORKSHOP_SCREEN_TOKEN.length > 0;
}

export function isValidWorkshopAccessToken(candidate: string) {
    if (!WORKSHOP_SCREEN_TOKEN || !candidate) return false;
    return timingSafeEqual(sha256(candidate), sha256(WORKSHOP_SCREEN_TOKEN));
}

export function getWorkshopAccessPath() {
    return hasWorkshopAccessToken()
        ? `/workshop/${encodeURIComponent(WORKSHOP_SCREEN_TOKEN)}`
        : "/workshop";
}
