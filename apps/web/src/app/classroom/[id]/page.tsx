"use client";

import type { classroomSchemaPayload } from "@redwood/contracts";
import { CornerUpLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { useFetchedRoomsStore } from "../../_components/room-store";
import ActiveIssues from "./_components/active-issues";
import Availability from "./_components/availability";
import MaintenanceHistory from "./_components/maintenance-history";
import OpenTasks from "./_components/open-tasks";
import RoomSummary from "./_components/room-summary";

export default function Page() {
  const params = useParams();
  const roomId = params.id as string;
  const { fetchedRooms } = useFetchedRoomsStore();
  const [room, setRoom] = useState<z.infer<typeof classroomSchemaPayload> | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    const foundRoom = fetchedRooms.find((room) => room._id === roomId);
    setRoom(foundRoom || undefined);
  }, [fetchedRooms, roomId]);

  return (
    <>
      <div className="mx-5 mt-5 xl:hidden">
        <div
          className="mb-2 flex w-fit cursor-pointer items-center gap-3 rounded-xl p-2 text-zinc-400 transition-all duration-150 hover:bg-zinc-900 active:scale-90 active:transform"
          onClick={() => router.push("/")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              router.push("/");
            }
          }}
        >
          <CornerUpLeft className="size-6" />
          Back to Classrooms
        </div>
        <div className="mb-10 flex flex-col gap-10">
          <RoomSummary room={room} />

          <div className="h-[50dvh]">
            <Availability room={room} />
          </div>
          <div className="h-[45dvh]">
            <ActiveIssues room={room} />
          </div>
          <div className="h-[45dvh]">
            <OpenTasks room={room} />
          </div>
          <div className="h-[40dvh]">
            <MaintenanceHistory roomId={room?._id} />
          </div>
        </div>
      </div>

      <div className="mt-5 mr-30 ml-30 hidden xl:block">
        <div
          className="mb-2 flex w-fit cursor-pointer items-center gap-3 rounded-xl p-2 text-zinc-400 transition-all duration-150 hover:bg-zinc-900 active:scale-90 active:transform"
          onClick={() => router.push("/")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              router.push("/");
            }
          }}
        >
          <CornerUpLeft className="size-6" />
          Back to Classrooms
        </div>

        <div className="flex h-[40dvh] gap-5">
          <RoomSummary room={room} />
          <Availability room={room} />
          <MaintenanceHistory roomId={roomId} />
        </div>
        <div className="mt-10 flex h-[45dvh] gap-10">
          <ActiveIssues room={room} />
          <OpenTasks room={room} />
        </div>
      </div>
    </>
  );
}
