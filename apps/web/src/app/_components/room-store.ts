import type { classroomSchemaPayload } from "@redwood/contracts";
import type { z } from "zod";
import { create } from "zustand/react";

type FetchedRoomsStore = {
  isFetching: boolean;
  fetchedRooms: z.infer<typeof classroomSchemaPayload>[];
  setFetchedRooms: (rooms: z.infer<typeof classroomSchemaPayload>[]) => void;
  setIsFetching: (isFetching: boolean) => void;
  setRoomsAndFetching: (rooms: z.infer<typeof classroomSchemaPayload>[], isFetching: boolean) => void;
  updateRoom: (roomId: string, updatedRoom: z.infer<typeof classroomSchemaPayload>) => void;
};

export const useFetchedRoomsStore = create<FetchedRoomsStore>((set) => ({
  isFetching: true,
  fetchedRooms: [],
  setFetchedRooms: (rooms) => set({ fetchedRooms: rooms }),
  setIsFetching: (isFetching) => set({ isFetching }),
  setRoomsAndFetching: (rooms, isFetching) => set({ fetchedRooms: rooms, isFetching }),
  updateRoom: (roomId, updatedRoom) =>
    set((state) => ({ fetchedRooms: state.fetchedRooms.map((room) => (room._id === roomId ? updatedRoom : room)) })),
}));
