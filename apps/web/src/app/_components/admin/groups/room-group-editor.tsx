import type { groupSchema } from "@redwood/contracts";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { webClientORPC } from "../../../../lib/orpc-web-client";
import { GroupClassroomSelector } from "./group-classroom-selector";
import { GroupSelector } from "./group-selector";
import { useGroupStore } from "./group-store";

export function RoomGroupEditor() {
  const [availableGroups, setAvailableGroups] = useState<z.infer<typeof groupSchema>[]>([]);
  const { setClassrooms } = useGroupStore();

  const { data: rooms } = useQuery(webClientORPC.classrooms.getRooms.queryOptions());
  const { data: groups } = useQuery(webClientORPC.groups.getGroups.queryOptions());

  useEffect(() => {
    if (rooms) setClassrooms(rooms);
  }, [rooms, setClassrooms]);

  useEffect(() => {
    if (groups) setAvailableGroups(groups);
  }, [groups]);

  return (
    <div className="mx-auto h-[calc(100vh-145px)] w-7xl text-zinc-100">
      <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-h-0 lg:col-span-2">
          <GroupClassroomSelector />
        </div>

        <div className="min-h-0 lg:col-span-1">
          <GroupSelector availableGroups={availableGroups} />
        </div>
      </div>
    </div>
  );
}
