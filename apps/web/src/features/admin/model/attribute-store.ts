import type { Doc, Id } from "@backend/convex/_generated/dataModel";
import { create } from "zustand";

// TODO: read & integrate https://tkdodo.eu/blog/zustand-and-react-context
type AttributeStore = {
  classrooms: Doc<"classrooms">[];
  selectedClassroomIds: Id<"classrooms">[];

  setClassrooms: (classrooms: Doc<"classrooms">[]) => void;
  toggleSelectedClassroom: (id: Id<"classrooms">) => void;
  selectAllClassrooms: () => void;
  deselectAllClassrooms: () => void;
  clearSelection: () => void;

  applyAttribute: (attributeId: Id<"attributes">) => void;
  removeAttribute: (attributeId: Id<"attributes">) => void;
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
