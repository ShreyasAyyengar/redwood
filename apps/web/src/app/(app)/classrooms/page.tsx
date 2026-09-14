"use client";

import { api } from "@backend/convex/_generated/api";
import { useQuery } from "convex/react";
import HomePage from "#/features/classrooms/components/home-page.tsx";

export default function ClassroomsPage() {
  const rooms = useQuery(api.core.classrooms.service.getAllRooms, {});

  if (!rooms) {
    return <div className="flex w-full items-center justify-center text-muted-foreground">Loading classrooms…</div>;
  }

  return <HomePage rooms={rooms} />;
}
