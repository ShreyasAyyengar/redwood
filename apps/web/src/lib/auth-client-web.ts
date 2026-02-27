import { electronProxyClient } from "@better-auth/electron/proxy";
import type { authServer } from "@redwood/api/auth-server";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "../env";

const basePath = env.NEXT_PUBLIC_NODE_ENV === "development" ? "/api/auth" : "/auth";

export const authClientWeb = createAuthClient({
  baseURL: env.NEXT_PUBLIC_API_URL,
  basePath,
  plugins: [
    inferAdditionalFields<typeof authServer>(),
    electronProxyClient({
      protocol: {
        scheme: "redwood", // TODO
      },
    }),
  ],
});
