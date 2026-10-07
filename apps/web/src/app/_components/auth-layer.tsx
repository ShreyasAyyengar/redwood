"use client";

import { useConvexAuth } from "convex/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { env } from "#/env.ts";
import { authClientWeb } from "#/lib/auth-client-web.ts";

export default function AuthLayer() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isAuthErrorPage = pathname === "/auth/error";

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isAuthErrorPage) {
      const search = searchParams.toString();
      const currentUrl = `${window.location.origin}${pathname}${search ? `?${search}` : ""}`;

      authClientWeb.signIn.social({
        provider: "google",
        callbackURL: currentUrl,
        errorCallbackURL: `${env.NEXT_PUBLIC_WEBSITE_URL}/auth/error`,
      });
    }
  }, [isLoading, isAuthenticated, pathname, searchParams, isAuthErrorPage]);

  return null;
}
