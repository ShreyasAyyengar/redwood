import { defineApp } from "convex/server";
import { v } from "convex/values";
import betterAuth from "./betterAuth/convex.config";

const app = defineApp({
  env: {
    WEBSITE_URL: v.string(),

    BETTER_AUTH_SECRET: v.string(),
    AUTH_BASE_PATH: v.string(),

    GOOGLE_CLIENT_ID: v.string(),
    GOOGLE_CLIENT_SECRET: v.string(),

    DISCORD_WEBHOOK_URL: v.string(),
  },
});
app.use(betterAuth);
export default app;
