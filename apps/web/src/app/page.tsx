"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { env } from "../env";
import { authClientWeb } from "../lib/auth-client-web";
import { webClientORPC } from "../lib/orpc-web-client";
import MainPage from "./_components/main-page";
import { useFetchedRoomsStore } from "./_components/room-store";

export default function Home() {
  const queryClient = useQueryClient();
  const { data, isPending } = authClientWeb.useSession();
  const { fetchedRooms, setFetchedRooms } = useFetchedRoomsStore();

  useEffect(() => {
    // force sign in if not signed in
    if (!(isPending || data)) {
      authClientWeb.signIn.social({
        provider: "google",
        callbackURL: `${env.NEXT_PUBLIC_WEBSITE_URL}`,
        errorCallbackURL: `${env.NEXT_PUBLIC_WEBSITE_URL}/auth/error`,
      });
    }
  }, [isPending, data]);

  const { data: roomData, isFetched } = useQuery(
    webClientORPC.classrooms.getRooms.queryOptions({
      enabled: !isPending && !!data,
    })
  );

  useEffect(() => {
    if (!isFetched || !roomData) return;
    setFetchedRooms(roomData);
  }, [roomData, isFetched]);

  if (isPending || !data || !isFetched)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-black p-4 font-sans text-white">
        <div className="gap-4 text-center">
          {"Loading Redwood...".split("").map((letter, i) => (
            <span key={i} className="inline-block animate-bounce font-bold text-3xl" style={{ animationDelay: `${i * 0.1}s` }}>
              {letter === " " ? "\u00A0" : letter}
            </span>
          ))}
        </div>
      </div>
    );

  return <MainPage />;
}
