import { roles } from "@redwood/contracts";
import { APIError, betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { multiSession } from "better-auth/plugins";
import { ConfigService } from "../database/config-service";
import { databaseConnection } from "../database/database";
import { env } from "../env";
import { hasCredentials } from "../util/user-util";

const database = databaseConnection.getClient().db(env.DATABASE_NAME);

const basePath = env.ENV === "development" ? "/api/auth" : "/auth";

export const authServer = betterAuth({
  database: mongodbAdapter(database),
  baseURL: env.API_URL,
  basePath,
  trustedOrigins: [env.WEBSITE_URL],

  plugins: [multiSession()],

  onAPIError: {
    errorURL: "http://localhost:3000/auth/error",
    throw: true,
  },

  socialProviders: {
    google: {
      prompt: "select_account consent",
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      accessType: "offline",
      mapProfileToUser: async (profile) => {
        const email = profile.email;
        if (await hasCredentials(email)) return profile;
        const headers = new Headers();
        headers.set("location", `${env.WEBSITE_URL}/auth/error`);
        throw new APIError("FOUND", undefined, headers);
        // status must be FOUND so that the redirect goes to WEBSITE_URL and not API_URL
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          // get their role:
          const config = await ConfigService.findOne({ "users.email": user.email }).lean();
          const role = config?.users.find((u) => u.email === user.email)?.role ?? "employee";
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

  user: {
    additionalFields: {
      role: {
        type: roles,
        required: true,
        defaultValue: "employee",
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 4,
    updateAge: 60 * 60 * 2,
  },
});
