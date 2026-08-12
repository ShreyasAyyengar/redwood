import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { inferAdditionalFields, multiSessionClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "../../../backend/convex/betterAuth/auth";

export const authClientWeb = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), convexClient(), multiSessionClient()],
});
