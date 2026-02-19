import { expoClient } from "@better-auth/expo/client";
import type { authServer } from "@fullstack-template/api/auth-server";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import SecureStore from "expo-secure-store";
import { env } from "@/env";

const basePath = env.EXPO_PUBLIC_NODE_ENV === "development" ? "/api/auth" : "/auth";

export const authClientExpo = createAuthClient({
  baseURL: env.EXPO_PUBLIC_API_URL,
  basePath,
  plugins: [
    inferAdditionalFields<typeof authServer>(),

    expoClient({
      scheme: "fullstacktemplate", // TODO
      storagePrefix: "fullstacktemplate", // TODO
      storage: SecureStore,
    }),
  ],
});
