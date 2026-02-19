import { electronClient } from "@better-auth/electron/client";
import { storage } from "@better-auth/electron/storage";
import type { authServer } from "@fullstack-template/api/auth-server";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "../env";

const basePath = env.VITE_NODE_ENV === "development" ? "/api/auth" : "/auth";

export const authClientElectron = createAuthClient({
  baseURL: env.VITE_API_URL,
  basePath,
  plugins: [
    inferAdditionalFields<typeof authServer>(),
    electronClient({
      signInURL: "https://fullstack.template/sign-in", // TODO
      protocol: {
        scheme: "fullstack.template", // TODO
      },
      storage: storage(),
    }),
  ],
});
