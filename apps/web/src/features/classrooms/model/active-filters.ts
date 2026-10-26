import { create } from "zustand/react";
import { dayAvailability, getBlocksForToday, getCaliClock } from "#/util/date-time-utils.ts";
import type { ClassroomSummary, RoomStatus } from "./classroom-types";

export type RoomFilterState = {
  exclusive: boolean;
  status: RoomStatus | undefined;
  attributeIds: string[];
  hasIssues: boolean;
  incompleteTasks: boolean;
  overdueTasks: boolean;
  availableNow: boolean;
  activeCaptioning: boolean;
  group: string | undefined;
};

type ActiveFiltersStore = RoomFilterState & {
  setExclusive: (exclusive: boolean) => void;
  setStatus: (status: RoomStatus | undefined) => void;
  setAttributeIds: (attributeIds: string[]) => void;
  setHasIssues: (hasIssues: boolean) => void;
  setIncompleteTasks: (incompleteTasks: boolean) => void;
  setOverdueTasks: (overdueTasks: boolean) => void;
  setAvailableNow: (availableNow: boolean) => void;
  setActiveCaptioning: (activeCaptioning: boolean) => void;
  setGroup: (group: string | undefined) => void;
};

export const getActiveFilterCount = ({
  status,
  attributeIds,
  hasIssues,
  incompleteTasks,
  overdueTasks,
  availableNow,
  activeCaptioning,
  group,
}: RoomFilterState) =>
  [
    status !== undefined,
    attributeIds.length > 0,
    hasIssues,
    incompleteTasks,
    overdueTasks,
    availableNow,
    activeCaptioning,
    group !== undefined,
  ].filter(Boolean).length;

export const roomMatchesActiveFilters = (room: ClassroomSummary, filters: RoomFilterState) => {
  const { exclusive, status, attributeIds, hasIssues, incompleteTasks, overdueTasks, availableNow, activeCaptioning, group } = filters;

  if (group && room.groupKey !== group) return false;
  if (attributeIds.length > 0 && !room.attributes.some((attributeId) => attributeIds.includes(attributeId))) return false;

  const checks: boolean[] = [];

  if (status) checks.push(room.roomStatus === status);

  if (hasIssues) checks.push(room.roomStatus !== "GOOD");

  if (incompleteTasks) checks.push(room.openTasksCount > 0);

  if (overdueTasks) checks.push(false);

  if (activeCaptioning) checks.push(room.captioning?.isCaptioningThisQuarter === true);

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
  attributeIds: [],
  hasIssues: false,
  incompleteTasks: false,
  overdueTasks: false,
  availableNow: false,
  activeCaptioning: false,
  group: undefined,

  setExclusive: (exclusive) => set({ exclusive }),
  setStatus: (status) => set({ status }),
  setAttributeIds: (attributeIds) => set({ attributeIds }),
  setHasIssues: (hasIssues) => set({ hasIssues }),
  setIncompleteTasks: (incompleteTasks) => set({ incompleteTasks }),
  setOverdueTasks: (overdueTasks) => set({ overdueTasks }),
  setAvailableNow: (availableNow) => set({ availableNow }),
  setActiveCaptioning: (activeCaptioning) => set({ activeCaptioning }),
  setGroup: (group) => set({ group }),
}));
