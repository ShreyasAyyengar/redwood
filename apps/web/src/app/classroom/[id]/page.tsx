"use client";

import type { classroomSchema } from "@redwood/contracts";
import { useQuery } from "@tanstack/react-query";
import { CornerUpLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
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
  const router = useRouter();

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
    <div className="mt-5 mr-30 ml-30">
      <div
        className="mb-5 flex w-fit cursor-pointer items-center gap-3 rounded-xl p-2 text-zinc-400 transition-all duration-150 hover:bg-zinc-900"
        onClick={() => router.back()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            router.back();
          }
        }}
      >
        <CornerUpLeft className="h-6 w-6" />
        Back to Classrooms
      </div>

      <div className="flex h-[40dvh] gap-10">
        <RoomSummary
          room={room}
          issueCount={issues?.filter((issue) => !issue.resolution).length ?? 0}
          taskCount={tasks?.filter((task) => !task.completion).length ?? 0}
        />
        <Availability room={room} />
        <MaintenanceHistory history={maintenanceHistory} />
      </div>
      <div className="mt-10 flex h-[45dvh] gap-10">
        <ActiveIssues issues={issues} />
        <OpenTasks tasks={tasks} />
      </div>
    </div>
  );
}
