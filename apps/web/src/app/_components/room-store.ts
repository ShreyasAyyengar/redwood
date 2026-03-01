import type { classroomSchema } from "@redwood/contracts";
import type { z } from "zod";
import { create } from "zustand/react";

type FetchedRoomsStore = {
  fetchedRooms: z.infer<typeof classroomSchema>[];
  setFetchedRooms: (rooms: z.infer<typeof classroomSchema>[]) => void;
};

export const useFetchedRoomsStore = create<FetchedRoomsStore>((set) => ({
  fetchedRooms: [],
  setFetchedRooms: (rooms) => set({ fetchedRooms: rooms }),
}));
