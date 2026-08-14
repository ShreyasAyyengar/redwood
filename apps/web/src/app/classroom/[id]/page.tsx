"use client";

import { api } from "@backend/convex/_generated/api";
import type { Id } from "@backend/convex/_generated/dataModel";
import { Button } from "@redwood/shad-ui/components/button";
import { CornerUpLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { authClientWeb } from "../../../lib/auth-client-web";
import ActiveIssuesPanel from "@/features/issues/components/active-issues-panel";
import Availability from "@/features/classrooms/components/detail/availability";
import { RoomSettingsDialog } from "@/features/classrooms/components/detail/room-settings-dialog";
import RoomSummary from "@/features/classrooms/components/detail/room-summary";
import MaintenanceHistory from "@/features/maintenance/components/maintenance-history";
import OpenTasks from "@/features/tasks/components/open-tasks-panel";

export default function Page() {
  const params = useParams();
  const roomId = params.id as Id<"classrooms">;
  const room = useQuery(api.core.classrooms.service.getRoom, { id: roomId });
  const router = useRouter();
  const { data: session } = authClientWeb.useSession();
  const canManageRoom = session?.user.role === "admin";

  return (
    <>
      <div className="mx-5 mt-5 xl:hidden">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div
            className="flex w-fit cursor-pointer items-center gap-3 rounded-xl p-2 text-zinc-400 transition-all duration-150 hover:bg-zinc-900 active:scale-90 active:transform"
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
          {canManageRoom && room && <RoomSettingsDialog room={room} />}
        </div>
        <div className="mb-10 flex flex-col gap-10">
          <RoomSummary room={room} />

          <div className="h-[50dvh]">
            <Availability room={room} />
          </div>
          <div className="h-[45dvh]">
            <ActiveIssuesPanel room={room} />
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
        <div className="mb-2 flex items-center justify-between gap-3">
          <Button variant="ghost" className="w-fit text-zinc-400 hover:bg-zinc-900" onClick={() => router.push("/")}>
            <CornerUpLeft className="size-5" />
            Back to Classrooms
          </Button>

          {canManageRoom && room && <RoomSettingsDialog room={room} />}
        </div>

        <div className="flex h-[40dvh] gap-5">
          <RoomSummary room={room} />
          <Availability room={room} />
          <MaintenanceHistory roomId={roomId} />
        </div>
        <div className="mt-10 flex h-[45dvh] gap-10">
          <ActiveIssuesPanel room={room} />
          <OpenTasks room={room} />
        </div>
      </div>
    </>
  );
}
