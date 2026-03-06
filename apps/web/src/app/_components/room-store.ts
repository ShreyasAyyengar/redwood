import type { classroomSchema } from "@redwood/contracts";
import type { z } from "zod";
import { create } from "zustand/react";

type FetchedRoomsStore = {
  isFetching: boolean;
  fetchedRooms: z.infer<typeof classroomSchema>[];
  setFetchedRooms: (rooms: z.infer<typeof classroomSchema>[]) => void;
  setIsFetching: (isFetching: boolean) => void;
  setRoomsAndFetching: (rooms: z.infer<typeof classroomSchema>[], isFetching: boolean) => void;
  updateRoom: (roomId: z.infer<typeof classroomSchema.shape._id>) => void;
};

export const useFetchedRoomsStore = create<FetchedRoomsStore>((set) => ({
  isFetching: true,
  fetchedRooms: [],
  setFetchedRooms: (rooms) => set({ fetchedRooms: rooms }),
  setIsFetching: (isFetching) => set({ isFetching }),
  setRoomsAndFetching: (rooms, isFetching) => set({ fetchedRooms: rooms, isFetching }),
  // updateRoom: (roomId) => set((state) => ({ fetchedRooms: state.fetchedRooms.map((r) => (r._id === roomId ? room : r)) })),
  updateRoom: (roomId) => {},
}));
