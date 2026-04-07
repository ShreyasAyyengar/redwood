import type { classroomSchema } from "@redwood/contracts";
import type { z } from "zod";
import { create } from "zustand/react";

type ActiveFiltersStpre = {
  exclusive: boolean;
  status: z.infer<typeof classroomSchema>["roomStatus"] | undefined;
  hasIssues: boolean;
  incompleteTasks: boolean;
  overdueTasks: boolean;
  availableNow: boolean;
  group: string | undefined;

  setExclusive: (exclusive: boolean) => void;
  setStatus: (status: z.infer<typeof classroomSchema>["roomStatus"] | undefined) => void;
  setHasIssues: (hasIssues: boolean) => void;
  setIncompleteTasks: (incompleteTasks: boolean) => void;
  setOverdueTasks: (overdueTasks: boolean) => void;
  setAvailableNow: (availableNow: boolean) => void;
  setGroup: (group: string | undefined) => void;
};

export const useActiveFiltersStore = create<ActiveFiltersStpre>((set) => ({
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
