import type { Doc, Id } from "@backend/convex/_generated/dataModel";
import { create } from "zustand";

type GroupStore = {
  classrooms: Doc<"classrooms">[];
  selectedClassroomIds: Id<"classrooms">[];

  setClassrooms: (classrooms: Doc<"classrooms">[]) => void;
  toggleSelectedClassroom: (id: Id<"classrooms">) => void;
  selectAllClassrooms: () => void;
  deselectAllClassrooms: () => void;
  clearSelection: () => void;

  applyGroup: (groupLabel: string) => void;
  removeGroup: (groupLabel: string) => void;
};

export const useGroupStore = create<GroupStore>((set) => ({
  classrooms: [],
  selectedClassroomIds: [],

  setClassrooms: (classrooms) => set({ classrooms }),

  toggleSelectedClassroom: (id) =>
    set((state) => {
      const isSelected = state.selectedClassroomIds.includes(id);
      return {
        selectedClassroomIds: isSelected ? state.selectedClassroomIds.filter((i) => i !== id) : [...state.selectedClassroomIds, id],
      };
    }),

  selectAllClassrooms: () =>
    set((state) => ({
      selectedClassroomIds: state.classrooms.map((c) => c._id),
    })),

  deselectAllClassrooms: () => set({ selectedClassroomIds: [] }),
  clearSelection: () => set({ selectedClassroomIds: [] }),

  applyGroup: (groupLabel) =>
    set((state) => ({
      classrooms: state.classrooms.map((c) => {
        if (state.selectedClassroomIds.includes(c._id)) {
          return { ...c, groupKey: groupLabel };
        }
        return c;
      }),
    })),

  removeGroup: (groupLabel) =>
    set((state) => ({
      classrooms: state.classrooms.map((c) => {
        if (state.selectedClassroomIds.includes(c._id) && c.groupKey === groupLabel) {
          return {
            ...c,
            groupKey: "Ungrouped",
          };
        }
        return c;
      }),
    })),
}));
