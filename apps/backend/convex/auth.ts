import type { GenericCtx } from "@convex-dev/better-auth";
import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { type BetterAuthOptions, betterAuth } from "better-auth/minimal";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { env } from "./_generated/server";
import authConfig from "./auth.config.ts";
import authSchema from "./betterAuth/schema";

export const authComponent = createClient<DataModel, typeof authSchema>(components.betterAuth, {
  local: {
    schema: authSchema,
  },
});

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    database: authComponent.adapter(ctx),
    plugins: [convex({ authConfig }), multiSession()],
    trustedOrigins: [env.WEBSITE_URL],
    baseURL: env.WEBSITE_URL + env.AUTH_BASE_PATH,
    socialProviders: {
      google: {
        prompt: "select_account consent",
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        accessType: "offline",
      },
    },
    // THIS IS USELESS UNLESS BETTERAUTH CAN FIX THEIR ROUTING. IF WORKS, MOVE DOMAIN LOGIC TO mapProfileToUser
    // onAPIError: {
    //   errorURL: "http://localhost:3000/error",
    //   throw: true,
    // },
  } satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) => betterAuth(createAuthOptions(ctx));
