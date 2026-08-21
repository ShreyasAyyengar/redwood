"use client";

import { type AuthClient, ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import { NuqsAdapter } from "nuqs/adapters/next";
import type { ReactNode } from "react";
import { env } from "#/env.ts";
import { authClientWeb } from "#/lib/auth-client-web.ts";

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

export function ConvexClientProvider({ children, initialToken }: { children: ReactNode; initialToken?: string | null }) {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClientWeb as unknown as AuthClient} initialToken={initialToken}>
      {children}
    </ConvexBetterAuthProvider>
  );
}

export default function Providers({ children, initialToken }: { children: ReactNode; initialToken?: string | null }) {
  return (
    <ConvexClientProvider initialToken={initialToken}>
      <NuqsAdapter>{children}</NuqsAdapter>
    </ConvexClientProvider>
  );
}
