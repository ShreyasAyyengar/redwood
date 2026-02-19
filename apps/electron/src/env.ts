import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE",
  client: {
    VITE_PROJECT_NAME: z.string().min(1),
    VITE_API_URL: z.string().min(1),
    VITE_WEBSITE_URL: z.string().min(1),
    VITE_HOSTNAME: z.string().min(1),
    VITE_NODE_ENV: z.enum(["development", "production"]),
  },

  runtimeEnv: {
    VITE_PROJECT_NAME: import.meta.env.VITE_PROJECT_NAME,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_WEBSITE_URL: import.meta.env.VITE_WEBSITE_URL,
    VITE_HOSTNAME: import.meta.env.VITE_HOSTNAME,
    VITE_NODE_ENV: import.meta.env.VITE_NODE_ENV,
  },
  emptyStringAsUndefined: true,
});
