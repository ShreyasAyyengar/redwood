import type { classroomSchema } from "@redwood/contracts";
import type { z } from "zod";
import { create } from "zustand";

type AttributeStore = {
  classrooms: z.infer<typeof classroomSchema>[];
  selectedClassroomIds: string[];

  setClassrooms: (classrooms: z.infer<typeof classroomSchema>[]) => void;
  toggleSelectedClassroom: (id: string) => void;
  selectAllClassrooms: () => void;
  deselectAllClassrooms: () => void;
  clearSelection: () => void;

  applyAttribute: (attributeId: string) => void;
  removeAttribute: (attributeId: string) => void;
};

export const useAttributeStore = create<AttributeStore>((set) => ({
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

  applyAttribute: (attributeId) =>
    set((state) => ({
      classrooms: state.classrooms.map((c) => {
        if (state.selectedClassroomIds.includes(c._id) && !c.attributes.includes(attributeId)) {
          return { ...c, attributes: [...c.attributes, attributeId] };
        }
        return c;
      }),
    })),

  removeAttribute: (attributeId) =>
    set((state) => ({
      classrooms: state.classrooms.map((c) => {
        if (state.selectedClassroomIds.includes(c._id)) {
          return {
            ...c,
            attributes: c.attributes.filter((a) => a !== attributeId),
          };
        }
        return c;
      }),
    })),
}));
