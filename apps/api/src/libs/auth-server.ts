import { electron } from "@better-auth/electron";
import { expo } from "@better-auth/expo";
import { APIError, betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { databaseConnection } from "../database/database";
import { env } from "../env";
import { hasCredentials } from "../util/user-util";

const database = databaseConnection.getClient().db(env.DATABASE_NAME);

const basePath = env.ENV === "development" ? "/api/auth" : "/auth";

export const authServer = betterAuth({
  database: mongodbAdapter(database),
  plugins: [electron(), expo()],
  baseURL: env.API_URL,
  basePath,
  trustedOrigins: [env.WEBSITE_URL, "redwood://", ...(env.ENV === "development" ? ["exp://"] : [])], // TODO
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
  user: {
    additionalFields: {
      role: {
        type: ["employee", "supervisor", "admin"],
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
