import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getImageUrl } from "@/lib/image-url";
import { isValidSession } from "@/lib/session";

/** Allowed hostnames for image fetching (prevents SSRF). */
function isAllowedImageUrl(urlOrKey: string): boolean {
    // R2 keys (no http prefix) are safe — resolved to the R2 CDN URL server-side
    if (!urlOrKey.startsWith("http://") && !urlOrKey.startsWith("https://")) {
        return true;
    }
    try {
        const parsed = new URL(urlOrKey);
        // Only allow HTTPS
        if (parsed.protocol !== "https:") return false;
        const host = parsed.hostname;
        // Custom CDN domain
        if (host === "images.bhenauto.com") return true;
        // Only the exact configured R2 public host — no wildcard *.r2.dev,
        // which would allow any public R2 bucket on the internet.
        const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
        if (r2PublicUrl) {
            try {
                const r2Host = new URL(r2PublicUrl).hostname;
                if (host === r2Host) return true;
            } catch {
                // ignore malformed env var
            }
        }
        return false;
    } catch {
        return false;
    }
}

/** Resolve an R2 key or full URL to a fetchable URL for AI analysis. */
function toFetchableUrl(urlOrKey: string): string {
    return getImageUrl(urlOrKey);
}

const BATCH_PROMPT = `Score each car photo 0-100 as a cover image for a car listing ad.

Scoring: 90-100=exterior front 3/4 full car, 75-89=full exterior other angle, 60-74=interior cockpit/dashboard, 40-59=partial exterior, 20-39=detail shots, 0-19=poor quality.

Respond ONLY with a JSON array, no markdown. Each element: {"index":<0-based>,"score":<number>,"angle":"<type>","reason":"<brief>"}`;

/** Retry a function with exponential backoff on transient 429 errors.
 *  Quota-exhaustion 429s (daily/project limit) are not retried — the window
 *  does not reset within our retry budget, so retrying just wastes latency. */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            const msg: string = err.message ?? "";
            const is429 = msg.includes("429") || msg.includes("Too Many Requests");
            const isQuotaExhausted = is429 && /quota|RESOURCE_EXHAUSTED/i.test(msg);
            if (is429 && !isQuotaExhausted && attempt < maxRetries) {
                const delay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
                await new Promise((r) => setTimeout(r, delay));
                continue;
            }
            throw err;
        }
    }
    throw new Error("Max retries exceeded");
}

export async function POST(request: NextRequest) {
    // Auth check — defence-in-depth (middleware also guards this route)
    const sessionCookie = request.cookies.get("admin_session")?.value;
    if (!await isValidSession(sessionCookie)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();

        // Reconstruct the ordered list of image sources.
        // Each entry is either a URL string (existing R2 image) or a File (new upload).
        // The form sends them as indexed entries: entries[0], entries[1], ...
        // with type "url" or "file" indicated by entriesType[i].
        const entryTypes = formData.getAll("entryTypes") as string[];    // "url" | "file"
        const entryUrls  = formData.getAll("entryUrls")  as string[];    // R2 key for "url" entries, empty for "file"
        const entryFiles  = formData.getAll("entryFiles") as (File | string)[];  // File for "file" entries, empty string for "url"

        if (entryTypes.length === 0) {
            return NextResponse.json({ error: "No images provided" }, { status: 400 });
        }

        if (entryTypes.length > 50) {
            return NextResponse.json({ error: "Too many images (max 50)" }, { status: 400 });
        }

        // Build an identifier list to return in the response (URL for existing, index-based for files)
        const imageIdentifiers: string[] = [];

        // SSRF protection — validate all URL entries before fetching
        for (let i = 0; i < entryTypes.length; i++) {
            if (entryTypes[i] === "url") {
                const url = entryUrls[i];
                if (typeof url !== "string" || !isAllowedImageUrl(url)) {
                    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
                }
                imageIdentifiers.push(url);
            } else {
                // For file entries, use a placeholder identifier that the client can map back
                imageIdentifiers.push(`__file_${i}__`);
            }
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                ordered: imageIdentifiers.map((id: string, i: number) => ({
                    url: id, score: 50 - i, angle: "unknown", reason: "AI niet geconfigureerd"
                })),
                aiEnabled: false,
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Build inline image data for Gemini — from R2 URLs or raw file bytes
        const imageDataParts = await Promise.all(
            entryTypes.map(async (type, i) => {
                let buffer: ArrayBuffer;
                let mimeType = "image/jpeg";

                if (type === "url") {
                    const fetchUrl = toFetchableUrl(entryUrls[i]);
                    const imgResponse = await globalThis.fetch(fetchUrl);
                    if (!imgResponse.ok) throw new Error(`Failed to fetch image ${i + 1}`);
                    buffer = await imgResponse.arrayBuffer();
                } else {
                    const file = entryFiles[i] as File;
                    if (!file || typeof file === "string") throw new Error(`Missing file for entry ${i}`);
                    buffer = await file.arrayBuffer();
                    mimeType = file.type || "image/jpeg";
                }

                return {
                    inlineData: {
                        data: Buffer.from(buffer).toString("base64"),
                        mimeType,
                    },
                };
            })
        );

        // Send ALL images in a single API call
        let text: string;
        try {
            const result = await withRetry(async () => {
                return model.generateContent([BATCH_PROMPT, ...imageDataParts]);
            });
            text = result.response.text().trim();
        } catch (aiErr: any) {
            console.warn("[AI Images] Gemini call failed:", aiErr.message);
            return NextResponse.json({
                ordered: imageIdentifiers.map((id: string, i: number) => ({
                    url: id, score: 50 - i, angle: "unknown", reason: "AI analyse niet bereikbaar (netwerk)"
                })),
                aiEnabled: false,
            });
        }

        // Guard: if we got an HTML page instead of JSON (e.g. proxy intercept)
        if (text.trimStart().startsWith("<")) {
            console.warn("[AI Images] Response looks like HTML. Falling back to original order.");
            return NextResponse.json({
                ordered: imageIdentifiers.map((id: string, i: number) => ({
                    url: id, score: 50 - i, angle: "unknown", reason: "AI analyse onderschept door netwerk proxy"
                })),
                aiEnabled: false,
            });
        }

        // Parse the JSON array response — strip markdown fences if present
        const jsonMatch = text.replace(/```json|```/g, "").match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("No JSON array found in AI response");

        const parsed: Array<{ index: number; score: number; angle: string; reason: string }> = JSON.parse(jsonMatch[0]);

        // Map scores back to image identifiers
        const scoredImages = imageIdentifiers.map((id: string, i: number) => {
            const entry = parsed.find((p) => p.index === i);
            return {
                url: id,
                score: entry ? Math.min(100, Math.max(0, Number(entry.score) || 50)) : 50,
                angle: entry?.angle || "unknown",
                reason: entry?.reason || "",
            };
        });

        const ordered = scoredImages.sort((a, b) => b.score - a.score);

        return NextResponse.json({ ordered, aiEnabled: true });
    } catch (error: any) {
        console.error("[AI Images] Fatal:", error);
        return NextResponse.json({ error: "Failed to analyze images" }, { status: 500 });
    }
}
