import { api } from "@backend/convex/_generated/api";
import type { Doc, Id } from "@backend/convex/_generated/dataModel";
import type { OptimisticLocalStore } from "convex/browser";

export type ClassroomMetadataPatch = Partial<Pick<Doc<"classrooms">, "attributes" | "captioning" | "groupKey">>;

export function optimisticallyPatchClassrooms(localStore: OptimisticLocalStore, patches: ReadonlyMap<Id<"classrooms">, ClassroomMetadataPatch>) {
  const patchRoom = <Room extends Doc<"classrooms">>(room: Room): Room => {
    const patch = patches.get(room._id);
    return patch ? { ...room, ...patch } : room;
  };

  const rooms = localStore.getQuery(api.core.classrooms.service.getAllRooms, {});
  if (rooms) localStore.setQuery(api.core.classrooms.service.getAllRooms, {}, rooms.map(patchRoom));

  const lookup = localStore.getQuery(api.core.classrooms.service.getClassroomLookup, {});
  if (lookup) localStore.setQuery(api.core.classrooms.service.getClassroomLookup, {}, lookup.map(patchRoom));

  for (const query of localStore.getAllQueries(api.core.classrooms.service.getRoom)) {
    if (!query.value) continue;
    localStore.setQuery(api.core.classrooms.service.getRoom, query.args, patchRoom(query.value));
  }
}

export function optimisticallyPatchClassroomsInGroup(localStore: OptimisticLocalStore, currentGroupKey: string, nextGroupKey: string) {
  const cachedRooms = [
    ...(localStore.getQuery(api.core.classrooms.service.getAllRooms, {}) ?? []),
    ...(localStore.getQuery(api.core.classrooms.service.getClassroomLookup, {}) ?? []),
  ];
  const patches = new Map<Id<"classrooms">, ClassroomMetadataPatch>();
  for (const room of cachedRooms) {
    if (room.groupKey === currentGroupKey) patches.set(room._id, { groupKey: nextGroupKey });
  }
  optimisticallyPatchClassrooms(localStore, patches);
}
