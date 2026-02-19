import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Project settings
    API_URL: z.string(),
    ENV: z.enum(["development", "production"]),
    WEBSITE_URL: z.string(),
    HOSTNAME: z.string(),

    // MongoDB connection string
    DATABASE_URL: z.string(),
    DATABASE_NAME: z.string(),

    // BetterAuth secret
    BETTER_AUTH_SECRET: z.string(),

    // Google OAuth credentials
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),

    // Cloudflare R2 credentials
    CLOUDFLARE_R2_ACCOUNT_ID: z.string(),
    CLOUDFLARE_R2_BUCKET_NAME: z.string(),
    CLOUDFLARE_R2_ACCESS_KEY_ID: z.string(),
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string(),
    CLOUDFLARE_R2_TOKEN_VALUE: z.string(),
  },

  // biome-ignore lint/correctness/noUndeclaredVariables: It's there; trust.
  runtimeEnv: Bun.env,

  emptyStringAsUndefined: true,
});
