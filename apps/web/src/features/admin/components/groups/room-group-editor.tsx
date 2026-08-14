import { api } from "@backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useEffect } from "react";
import { GroupClassroomSelector } from "./group-classroom-selector";
import { GroupSelector } from "./group-selector";
import { useGroupStore } from "../../model/group-store";

export function RoomGroupEditor() {
  const { setClassrooms } = useGroupStore();

  const rooms = useQuery(api.core.classrooms.service.getAllRooms, {});
  const groups = useQuery(api.core.groups.service.getGroups, {});

  useEffect(() => {
    if (rooms) setClassrooms(rooms);
  }, [rooms, setClassrooms]);

  return (
    <div className="mx-auto h-[calc(100vh-145px)] w-7xl pb-5 text-zinc-100">
      <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-h-0 lg:col-span-2">
          <GroupClassroomSelector />
        </div>

        <div className="min-h-0 lg:col-span-1">
          <GroupSelector availableGroups={groups ?? []} />
        </div>
      </div>
    </div>
  );
}
