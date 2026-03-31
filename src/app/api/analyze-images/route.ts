import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Fix macOS Node.js SSL certificate issue
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";



/** Convert Cloudinary URL to small thumbnail for analysis */
function toThumbnailUrl(url: string): string {
    return url.replace("/upload/", "/upload/w_200,q_40,f_jpg/");
}

const BATCH_PROMPT = `Score each car photo 0-100 as a cover image for a car listing ad.

Scoring: 90-100=exterior front 3/4 full car, 75-89=full exterior other angle, 60-74=interior cockpit/dashboard, 40-59=partial exterior, 20-39=detail shots, 0-19=poor quality.

Respond ONLY with a JSON array, no markdown. Each element: {"index":<0-based>,"score":<number>,"angle":"<type>","reason":"<brief>"}`;

/** Retry a function with exponential backoff on 429 errors */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            const is429 = err.message?.includes("429") || err.message?.includes("Too Many Requests");
            if (is429 && attempt < maxRetries) {
                const delay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
                console.log(`[AI Images] Rate limited. Retrying in ${delay / 1000}s (attempt ${attempt + 1}/${maxRetries})...`);
                await new Promise((r) => setTimeout(r, delay));
                continue;
            }
            throw err;
        }
    }
    throw new Error("Max retries exceeded");
}

export async function POST(request: NextRequest) {
    try {
        const { imageUrls } = await request.json();

        if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
            return NextResponse.json({ error: "No image URLs provided" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                ordered: imageUrls.map((url: string, i: number) => ({
                    url, score: 50 - i, angle: "unknown", reason: "AI niet geconfigureerd"
                })),
                aiEnabled: false,
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        console.log(`[AI Images] Analyzing ${imageUrls.length} image(s) in single batch...`);

        // Fetch all thumbnails in parallel
        const imageDataParts = await Promise.all(
            imageUrls.map(async (url: string, i: number) => {
                const thumbUrl = toThumbnailUrl(url);
                const imgResponse = await globalThis.fetch(thumbUrl);
                if (!imgResponse.ok) throw new Error(`Failed to fetch thumbnail ${i + 1}: ${imgResponse.status}`);
                const buffer = await imgResponse.arrayBuffer();
                console.log(`[AI Images] Thumbnail ${i + 1}: ${(buffer.byteLength / 1024).toFixed(0)}KB`);
                return {
                    inlineData: {
                        data: Buffer.from(buffer).toString("base64"),
                        mimeType: "image/jpeg",
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
            console.log(`[AI Images] Batch response: ${text.substring(0, 300)}`);
        } catch (aiErr: any) {
            console.warn("[AI Images] Gemini call failed (possibly Zscaler intercept):", aiErr.message);
            // Fall back to original order
            return NextResponse.json({
                ordered: imageUrls.map((url: string, i: number) => ({
                    url, score: 50 - i, angle: "unknown", reason: "AI analyse niet bereikbaar (netwerk)"
                })),
                aiEnabled: false,
            });
        }

        // Guard: if we got an HTML page instead of JSON (e.g. Zscaler block page)
        if (text.trimStart().startsWith("<")) {
            console.warn("[AI Images] Response looks like HTML (Zscaler/proxy intercept). Falling back to original order.");
            return NextResponse.json({
                ordered: imageUrls.map((url: string, i: number) => ({
                    url, score: 50 - i, angle: "unknown", reason: "AI analyse onderschept door netwerk proxy"
                })),
                aiEnabled: false,
            });
        }

        // Parse the JSON array response — strip markdown fences if present
        const jsonMatch = text.replace(/```json|```/g, "").match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error(`No JSON array found in response: ${text.substring(0, 200)}`);

        const parsed: Array<{ index: number; score: number; angle: string; reason: string }> = JSON.parse(jsonMatch[0]);

        // Map scores back to image URLs
        const scoredImages = imageUrls.map((url: string, i: number) => {
            const entry = parsed.find((p) => p.index === i);
            return {
                url,
                score: entry ? Math.min(100, Math.max(0, Number(entry.score) || 50)) : 50,
                angle: entry?.angle || "unknown",
                reason: entry?.reason || "",
            };
        });

        const ordered = scoredImages.sort((a, b) => b.score - a.score);
        console.log(`[AI Images] Final: ${ordered.map((o) => `${o.score}(${o.angle})`).join(", ")}`);

        return NextResponse.json({ ordered, aiEnabled: true });
    } catch (error: any) {
        console.error("[AI Images] Fatal:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
