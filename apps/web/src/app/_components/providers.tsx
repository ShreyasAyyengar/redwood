"use client";

import { type AuthClient, ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { isServer, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexReactClient } from "convex/react";
import { NuqsAdapter } from "nuqs/adapters/next";
import type { ReactNode } from "react";
import { env } from "../../env";
import { authClientWeb } from "../../lib/auth-client-web";

const STALE_TIME = 60 * 1000;
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: STALE_TIME,
      },
    },
  });
}
let browserQueryClient: QueryClient | undefined;
function getQueryClient() {
  if (isServer) return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);
// The provider's AuthClient type is narrower than Better Auth's inferred type
// when additional client plugins are present. The required Convex plugin is
// included in authClientWeb, so the clients are runtime-compatible.
const convexAuthClient = authClientWeb as unknown as AuthClient;

export function ConvexClientProvider({ children, initialToken }: { children: ReactNode; initialToken?: string | null }) {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={convexAuthClient} initialToken={initialToken}>
      {children}
    </ConvexBetterAuthProvider>
  );
}

export default function Providers({ children, initialToken }: { children: ReactNode; initialToken?: string | null }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ConvexClientProvider initialToken={initialToken}>
        <NuqsAdapter>{children}</NuqsAdapter>
      </ConvexClientProvider>
    </QueryClientProvider>
  );
}
