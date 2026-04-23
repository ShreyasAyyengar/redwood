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
  },

  // biome-ignore lint/correctness/noUndeclaredVariables: It's there; trust.
  runtimeEnv: Bun.env,

  emptyStringAsUndefined: true,
});
