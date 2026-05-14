import type { authServer } from "@redwood/api/auth-server";
// biome-ignore lint/correctness/noUnusedImports: fixes TS compile error of (The inferred type of 'authClientWeb' cannot be named without a reference to 'InferSignUpEmailCtx')
import type { InferSignUpEmailCtx } from "better-auth/client";
import { inferAdditionalFields, multiSessionClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "../env";

const basePath = env.NEXT_PUBLIC_NODE_ENV === "development" ? "/api/auth" : "/auth";

export const authClientWeb = createAuthClient({
  baseURL: env.NEXT_PUBLIC_API_URL,
  basePath,
  plugins: [inferAdditionalFields<typeof authServer>(), multiSessionClient()],
});
