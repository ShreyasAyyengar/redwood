"use client";

import { authClientWeb } from "../lib/auth-client-web";
import HomePage from "./_components/home-page";
import LoadingComponent from "./_components/loading";
import { useFetchedRoomsStore } from "./_components/room-store";

export default function Home() {
  const { data, isPending } = authClientWeb.useSession();
  const { fetchedRooms } = useFetchedRoomsStore();

  if (isPending || !data || fetchedRooms.length === 0) return <LoadingComponent />;

  return <HomePage />;
}
