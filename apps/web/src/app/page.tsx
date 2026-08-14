"use client";

import { api } from "@backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { authClientWeb } from "../lib/auth-client-web";
import HomePage from "@/features/classrooms/components/home-page";
import LoadingComponent from "./_components/loading";

export default function Home() {
  const { data, isPending } = authClientWeb.useSession();
  const rooms = useQuery(api.core.classrooms.service.getAllRooms, data ? {} : "skip");

  if (isPending || !data || !rooms) return <LoadingComponent />;

  return <HomePage rooms={rooms} />;
}
