import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Fix macOS Node.js SSL certificate issue
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const SCORING_PROMPT = `You are an expert automotive advertising photographer.

Analyze this car listing photo and score it 0-100 as COVER IMAGE for a car ad.

Scoring rules:
- 90-100: Exterior front 3/4 angle, full car visible, clean background, great lighting
- 75-89: Full exterior side/rear, good lighting and background
- 60-74: Interior dashboard/cockpit shots, clean and well-lit
- 40-59: Partial exterior, mediocre lighting or busy background
- 20-39: Detail shots (wheels, badges, buttons, engine) - supporting only
- 0-19: Blurry, dark, or poorly composed

Respond with ONLY valid JSON, no markdown, no code blocks:
{"score": 85, "angle": "exterior_front_quarter", "reason": "Strong 3/4 front view"}`;

/** Convert Cloudinary URL to small thumbnail for analysis */
function toThumbnailUrl(url: string): string {
    return url.replace("/upload/", "/upload/w_400,q_60,f_jpg/");
}

async function analyzeImage(
    model: any,
    imageUrl: string
): Promise<{ score: number; angle: string; reason: string }> {
    const thumbUrl = toThumbnailUrl(imageUrl);
    const imgResponse = await globalThis.fetch(thumbUrl);
    if (!imgResponse.ok) throw new Error(`Failed to fetch thumbnail: ${imgResponse.status}`);

    const buffer = await imgResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    console.log(`[AI Images] Thumbnail: ${(buffer.byteLength / 1024).toFixed(0)}KB`);

    const result = await model.generateContent([
        SCORING_PROMPT,
        { inlineData: { data: base64, mimeType: "image/jpeg" } },
    ]);

    const text = result.response.text().trim();
    console.log(`[AI Images] Response: ${text}`);

    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error(`No JSON found: ${text.substring(0, 100)}`);

    const parsed = JSON.parse(jsonMatch[0]);
    return {
        score: Math.min(100, Math.max(0, Number(parsed.score) || 50)),
        angle: parsed.angle || "unknown",
        reason: parsed.reason || "",
    };
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
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        console.log(`[AI Images] Analyzing ${imageUrls.length} image(s)...`);

        const scoredImages = [];

        for (let i = 0; i < imageUrls.length; i++) {
            try {
                console.log(`[AI Images] Image ${i + 1}/${imageUrls.length}...`);
                const result = await analyzeImage(model, imageUrls[i]);
                console.log(`[AI Images] ✓ Image ${i + 1}: score=${result.score}`);
                scoredImages.push({ url: imageUrls[i], ...result });
            } catch (err: any) {
                console.error(`[AI Images] ✗ Image ${i + 1}: ${err.message}`);
                scoredImages.push({ url: imageUrls[i], score: 50, angle: "unknown", reason: err.message });
            }
        }

        const ordered = scoredImages.sort((a, b) => b.score - a.score);
        console.log(`[AI Images] Final: ${ordered.map((o) => o.score).join(", ")}`);

        return NextResponse.json({ ordered, aiEnabled: true });
    } catch (error: any) {
        console.error("[AI Images] Fatal:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
