import type { classroomSchemaPayload } from "@redwood/contracts";
import { useMemo } from "react";
import type { z } from "zod";
import { useShallow } from "zustand/react/shallow";
import { getActiveFilterCount, roomMatchesActiveFilters, useActiveFiltersStore } from "../table/active-filters";
import RoomCard from "./room-card";

export default function RoomList({ data }: { data: z.infer<typeof classroomSchemaPayload>[] }) {
  const filterState = useActiveFiltersStore(
    useShallow((s) => ({
      exclusive: s.exclusive,
      status: s.status,
      hasIssues: s.hasIssues,
      incompleteTasks: s.incompleteTasks,
      overdueTasks: s.overdueTasks,
      availableNow: s.availableNow,
      group: s.group,
    }))
  );

  const filteredRooms = useMemo(() => data.filter((room) => roomMatchesActiveFilters(room, filterState)), [data, filterState]);
  const activeCount = getActiveFilterCount(filterState);

  if (filteredRooms.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg bg-neutral-900 p-6 text-center shadow-xl/50 ring-1 ring-black/5">
        <div className="flex max-w-60 flex-col gap-2">
          <p className="font-semibold text-neutral-100">No rooms found</p>
          <p className="text-neutral-400 text-sm">
            {activeCount > 0 ? "Reset or adjust filters to see more classrooms." : "Classrooms will appear here once they are loaded."}
          </p>
        </div>
      </div>
    );
  }

  return filteredRooms.map((room) => <RoomCard key={room._id} room={room} />);
}
