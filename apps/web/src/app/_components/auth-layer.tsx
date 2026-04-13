"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { env } from "../../env";
import { authClientWeb } from "../../lib/auth-client-web";
import { webClientORPC } from "../../lib/orpc-web-client";
import { useFetchedRoomsStore } from "./room-store";

export default function AuthLayer() {
  const { data, isPending } = authClientWeb.useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isPending && !data) {
      const search = searchParams.toString();
      const currentUrl = `${window.location.origin}${pathname}${search ? `?${search}` : ""}`;

      authClientWeb.signIn.social({
        provider: "google",
        callbackURL: currentUrl,
        errorCallbackURL: `${env.NEXT_PUBLIC_WEBSITE_URL}/auth/error`,
      });
    }
  }, [isPending, data, pathname, searchParams]);

  const { setRoomsAndFetching } = useFetchedRoomsStore();

  const { data: roomData, isFetched } = useQuery(
    webClientORPC.classrooms.getRooms.queryOptions({
      enabled: !isPending && !!data,
    })
  );

  useEffect(() => {
    if (!isFetched || !roomData) return;
    setRoomsAndFetching(roomData, false);
  }, [roomData, isFetched, setRoomsAndFetching]);

  return null;
}
