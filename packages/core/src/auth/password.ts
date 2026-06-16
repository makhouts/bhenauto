import { createHash, timingSafeEqual } from "crypto";

export function constantTimePasswordMatch(candidate: string, expected: string): boolean {
    const a = createHash("sha256").update(candidate).digest();
    const b = createHash("sha256").update(expected).digest();
    return timingSafeEqual(a, b);
}
