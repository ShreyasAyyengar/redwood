import type { GenericCtx } from "@convex-dev/better-auth";
import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { APIError } from "better-auth";
import { type BetterAuthOptions, betterAuth } from "better-auth/minimal";
import { multiSession } from "better-auth/plugins";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { env } from "./_generated/server";
import authConfig from "./auth.config.ts";
import authSchema from "./betterAuth/schema";
import type { roles } from "./core/users/schemas.ts";

export const authComponent = createClient<DataModel, typeof authSchema>(components.betterAuth, {
  local: {
    schema: authSchema,
  },
});

type Role = (typeof roles)[number];

async function getRoleForEmail(ctx: GenericCtx<DataModel>, email: string): Promise<Role> {
  return await ctx.runQuery(internal.core.users.service.getRole, { email });
}

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
        mapProfileToUser: async (profile) => {
          const { email } = profile;
          const { exists } = await ctx.runQuery(internal.core.users.service.hasCredentials, { email });

          if (exists) return profile;
          const headers = new Headers();
          headers.set("location", `${env.WEBSITE_URL}/auth/error`);
          throw new APIError("FOUND", undefined, headers);
          // status must be FOUND so that the redirect goes to WEBSITE_URL and not API_URL
        },
      },
    },

    // THIS IS USELESS UNLESS BETTERAUTH CAN FIX THEIR ROUTING. IF WORKS, MOVE DOMAIN LOGIC TO mapProfileToUser
    // onAPIError: {
    //   errorURL: "http://localhost:3000/error",
    //   throw: true,
    // },
    user: {
      additionalFields: {
        role: {
          // The Convex schema generator cannot translate Better Auth enum-array field types.
          type: "string",
          required: true,
          defaultValue: "employee",
          input: false,
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const role = await getRoleForEmail(ctx, user.email);

            return {
              data: {
                ...user,
                role,
              },
            };
          },
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 8,
      updateAge: 60 * 60 * 2,
    },
  } satisfies BetterAuthOptions;
};

export const options = createAuthOptions({} as GenericCtx<DataModel>);

export const createAuth = (ctx: GenericCtx<DataModel>) => betterAuth(createAuthOptions(ctx));
