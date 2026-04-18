import { z } from "zod";

/**
 * Validated environment variables. Import this module anywhere server-side
 * to fail fast at boot if a required variable is missing or malformed.
 *
 * GEMINI_API_KEY is optional — absence disables AI image scoring rather than
 * crashing the app.
 */
const EnvSchema = z.object({
    DATABASE_URL: z.string().min(1),
    DIRECT_URL: z.string().min(1),
    ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD must be at least 8 characters"),
    ADMIN_SESSION_SECRET: z.string().min(32, "ADMIN_SESSION_SECRET must be at least 32 characters"),
    R2_ACCOUNT_ID: z.string().min(1),
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    R2_BUCKET_NAME: z.string().min(1),
    NEXT_PUBLIC_R2_PUBLIC_URL: z.string().url(),
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
    GEMINI_API_KEY: z.string().optional(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
    const issues = parsed.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
