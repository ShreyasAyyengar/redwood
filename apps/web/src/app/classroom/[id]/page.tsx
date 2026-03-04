"use client";

import type { classroomSchema } from "@redwood/contracts";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { webClientORPC } from "../../../lib/orpc-web-client";
import { useFetchedRoomsStore } from "../../_components/room-store";
import Availability from "./_components/availability";
import RoomSummary from "./_components/room-summary";

export default function RoomPage() {
  const params = useParams();
  const roomId = params.id as string;
  const { isFetching, fetchedRooms } = useFetchedRoomsStore();
  const [room, setRoom] = useState<z.infer<typeof classroomSchema> | null>(null);

  useEffect(() => {
    const foundRoom = fetchedRooms.find((room) => room._id === roomId);
    setRoom(foundRoom || null);
  }, [fetchedRooms, roomId]);

  const { data: maintenanceHistory } = useQuery(
    webClientORPC.maintenance.getHistory.queryOptions({
      input: { classroomId: roomId },
      enabled: !!room,
    })
  );

  const { data: issues } = useQuery(
    webClientORPC.maintenance.getIssues.queryOptions({
      input: { classroomId: roomId },
      enabled: !!room,
    })
  );

  const { data: tasks } = useQuery(
    webClientORPC.maintenance.getTasks.queryOptions({
      input: { classroomId: roomId },
      enabled: !!room,
    })
  );

  if (isFetching) return <div>Loading...</div>;
  if (!room) return <div>Room not found</div>;

  return (
    <div className="mt-20 mr-30 ml-30 flex h-[40dvh] rounded-2xl border border-zinc-600">
      <RoomSummary room={room} issueCount={issues?.length ?? 0} taskCount={tasks?.length ?? 0} />
      <Availability room={room} />
      {/*<MaintenanceHistory history={maintenanceHistory} />*/}

      {/*<div className="1 grid min-h-0 grid-cols-1 gap-5 lg:grid-cols-12">*/}
      {/*  /!* Room summary *!/*/}
      {/*  <div className="0 flex min-h-0 w-auto flex-col gap-5 border border-red-500 lg:col-span-5">*/}
      {/*    <RoomSummary room={room} />*/}
      {/*    <ActiveIssues issues={issues} />*/}
      {/*    <MaintenanceHistory history={maintenanceHistory} />*/}
      {/*  </div>*/}

      {/*  /!* Right column stack (desktop) / below (mobile) *!/*/}
      {/*  <div className="flex min-h-0 flex-col gap-5 lg:col-span-5" />*/}
      {/*</div>*/}
    </div>
  );
}
