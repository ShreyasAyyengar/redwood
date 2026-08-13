"use client";

import { convexQuery, useConvexAuth } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../../../backend/convex/_generated/api";
import { env } from "../../env";
import { authClientWeb } from "../../lib/auth-client-web";
import { useFetchedRoomsStore } from "./room-store";

export default function AuthLayer() {
  const { data, isPending } = authClientWeb.useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isAuthErrorPage = pathname === "/auth/error";

  useEffect(() => {
    if (!isPending && !data && !isAuthErrorPage) {
      const search = searchParams.toString();
      const currentUrl = `${window.location.origin}${pathname}${search ? `?${search}` : ""}`;

      authClientWeb.signIn.social({
        provider: "google",
        callbackURL: currentUrl,
        errorCallbackURL: `${env.NEXT_PUBLIC_WEBSITE_URL}/auth/error`,
      });
    }
  }, [isPending, data, pathname, searchParams, isAuthErrorPage]);

  const { setRoomsAndFetching } = useFetchedRoomsStore();

  const { isLoading, isAuthenticated } = useConvexAuth();
  const { data: roomData, isFetched } = useQuery(
    convexQuery(api.core.classrooms.service.getAllRooms, !isLoading && isAuthenticated ? {} : "skip")
  );

  useEffect(() => {
    if (!isFetched || !roomData) return;
    setRoomsAndFetching(roomData, false);
  }, [roomData, isFetched, setRoomsAndFetching]);

  return null;
}
