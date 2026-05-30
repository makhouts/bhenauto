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
    SMTP_USER: z.string().email().default("info@bhenauto.com"),
    SMTP_PASS: z.string().min(1).optional(),
    TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
    GEMINI_API_KEY: z.string().optional(),
    CRON_SECRET: z.string().min(16).optional(),
    AUTOSCOUT24_USERNAME: z.string().min(1).optional(),
    AUTOSCOUT24_PASSWORD: z.string().min(1).optional(),
    AUTOSCOUT24_CUSTOMER_ID: z.string().min(1).optional(),
    AUTOSCOUT24_MARKETPLACE: z.string().min(2).default("be"),
    AUTOSCOUT24_CULTURE: z.string().min(5).default("nl-BE"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
}).superRefine((env, ctx) => {
    const hasAutoscoutConfig = Boolean(
        env.AUTOSCOUT24_USERNAME ||
        env.AUTOSCOUT24_PASSWORD ||
        env.AUTOSCOUT24_CUSTOMER_ID
    );
    if (hasAutoscoutConfig) {
        for (const key of ["AUTOSCOUT24_USERNAME", "AUTOSCOUT24_PASSWORD"] as const) {
            if (!env[key]) {
                ctx.addIssue({
                    code: "custom",
                    path: [key],
                    message: `${key} is required when AutoScout24 integration is configured`,
                });
            }
        }
    }

    if (env.NODE_ENV !== "production") return;

    const requiredInProduction: Array<keyof typeof env> = [
        "SMTP_PASS",
        "TURNSTILE_SECRET_KEY",
        "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    ];

    for (const key of requiredInProduction) {
        if (!env[key]) {
            ctx.addIssue({
                code: "custom",
                path: [key],
                message: `${key} is required in production`,
            });
        }
    }
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
    const issues = parsed.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
