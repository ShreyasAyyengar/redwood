import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_PROJECT_NAME: z.string().min(1),
    EXPO_PUBLIC_API_URL: z.string().min(1),
    EXPO_PUBLIC_WEBSITE_URL: z.string().min(1),
    EXPO_PUBLIC_HOSTNAME: z.string().min(1),
    EXPO_PUBLIC_NODE_ENV: z.enum(["development", "production"]),
  },

  runtimeEnv: {
    EXPO_PUBLIC_PROJECT_NAME: process.env.EXPO_PUBLIC_PROJECT_NAME,
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_WEBSITE_URL: process.env.EXPO_PUBLIC_WEBSITE_URL,
    EXPO_PUBLIC_HOSTNAME: process.env.EXPO_PUBLIC_HOSTNAME,
    EXPO_PUBLIC_NODE_ENV: process.env.EXPO_PUBLIC_NODE_ENV,
  },
  emptyStringAsUndefined: true,
});
