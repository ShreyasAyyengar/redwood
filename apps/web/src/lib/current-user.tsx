"use client";

import { api } from "@backend/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { usePathname } from "next/navigation";
import { createContext, type ReactNode, useContext } from "react";
import LoadingScreen from "#/app/_components/loading.tsx";

export type CurrentUser = FunctionReturnType<typeof api.auth.getAuthUser>;

const CurrentUserContext = createContext<CurrentUser | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const isAuthErrorPage = usePathname() === "/auth/error";
  const user = useQuery(api.auth.getAuthUser, isAuthenticated && !isAuthErrorPage ? {} : "skip");

  if (isAuthErrorPage) return children;
  if (isLoading || !isAuthenticated || !user) return <LoadingScreen />;

  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  const user = useContext(CurrentUserContext);
  if (!user) throw new Error("useCurrentUser must be used within authenticated content");
  return user;
}
