"use client";

import { authClientWeb } from "../lib/auth-client-web";
import HomePage from "./_components/home-page";
import LoadingComponent from "./_components/loading";
import { useFetchedRoomsStore } from "./_components/room-store";

export default function Home() {
  const { data, isPending } = authClientWeb.useSession();
  const { isFetching } = useFetchedRoomsStore();

  if (isPending || !data || isFetching) return <LoadingComponent />;

  return <HomePage />;
}
