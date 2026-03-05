"use client";

import type { classroomSchema } from "@redwood/contracts";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { webClientORPC } from "../../../lib/orpc-web-client";
import { useFetchedRoomsStore } from "../../_components/room-store";
import ActiveIssues from "./_components/active-issues";
import Availability from "./_components/availability";
import MaintenanceHistory from "./_components/maintenance-history";
import OpenTasks from "./_components/open-tasks";
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
    <div className="mt-10 mr-30 ml-30">
      <div className="flex flex-col rounded-2xl shadow-xl/80">
        <div className="flex h-[40dvh] w-full">
          <RoomSummary
            room={room}
            issueCount={issues?.filter((issue) => !issue.resolution).length ?? 0}
            taskCount={tasks?.filter((task) => !task.completion).length ?? 0}
          />
          <div className="flex w-1/2">
            <Availability room={room} />
          </div>
          <MaintenanceHistory history={maintenanceHistory} />
        </div>
      </div>
      <div className="mt-10 flex h-[50dvh] gap-10">
        <ActiveIssues issues={issues} />
        <OpenTasks tasks={tasks} />
      </div>
    </div>
  );
}
