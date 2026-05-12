import type { classroomSchema, classroomSchemaPayload } from "@redwood/contracts";
import type { z } from "zod";
import { create } from "zustand/react";
import { dayAvailability, getBlocksForToday, getCaliClock } from "../../../util/date-time-utils";

export type RoomFilterState = {
  exclusive: boolean;
  status: z.infer<typeof classroomSchema>["roomStatus"] | undefined;
  hasIssues: boolean;
  incompleteTasks: boolean;
  overdueTasks: boolean;
  availableNow: boolean;
  group: string | undefined;
};

type ActiveFiltersStore = RoomFilterState & {
  setExclusive: (exclusive: boolean) => void;
  setStatus: (status: z.infer<typeof classroomSchema>["roomStatus"] | undefined) => void;
  setHasIssues: (hasIssues: boolean) => void;
  setIncompleteTasks: (incompleteTasks: boolean) => void;
  setOverdueTasks: (overdueTasks: boolean) => void;
  setAvailableNow: (availableNow: boolean) => void;
  setGroup: (group: string | undefined) => void;
};

export const getActiveFilterCount = ({ status, hasIssues, incompleteTasks, overdueTasks, availableNow, group }: RoomFilterState) =>
  [status !== undefined, hasIssues, incompleteTasks, overdueTasks, availableNow, group !== undefined].filter(Boolean).length;

export const roomMatchesActiveFilters = (room: z.infer<typeof classroomSchemaPayload>, filters: RoomFilterState) => {
  const { exclusive, status, hasIssues, incompleteTasks, overdueTasks, availableNow, group } = filters;

  if (group && room.groupKey !== group) return false;

  const checks: boolean[] = [];

  if (status) checks.push(room.roomStatus === status);

  if (hasIssues) checks.push(room.roomStatus !== "GOOD");

  if (incompleteTasks) checks.push(room.openTasksCount > 0);

  if (overdueTasks) checks.push(false);

  if (availableNow) {
    if (!room.schedule) {
      checks.push(false);
    } else {
      const { weekdayKey, nowMin } = getCaliClock();
      const blocks = getBlocksForToday(room.schedule, weekdayKey);
      const availability = dayAvailability(blocks, nowMin);
      checks.push(availability.kind === "open");
    }
  }

  if (checks.length === 0) return true;

  return exclusive ? checks.every(Boolean) : checks.some(Boolean);
};

export const useActiveFiltersStore = create<ActiveFiltersStore>((set) => ({
  exclusive: false,
  status: undefined,
  hasIssues: false,
  incompleteTasks: false,
  overdueTasks: false,
  availableNow: false,
  group: undefined,

  setExclusive: (exclusive) => set({ exclusive }),
  setStatus: (status) => set({ status }),
  setHasIssues: (hasIssues) => set({ hasIssues }),
  setIncompleteTasks: (incompleteTasks) => set({ incompleteTasks }),
  setOverdueTasks: (overdueTasks) => set({ overdueTasks }),
  setAvailableNow: (availableNow) => set({ availableNow }),
  setGroup: (group) => set({ group }),
}));
