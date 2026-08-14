import type { api } from "@backend/convex/_generated/api";
import type { Doc } from "@backend/convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";

export type Classroom = Doc<"classrooms">;
export type ClassroomSummary = FunctionReturnType<typeof api.core.classrooms.service.getAllRooms>[number];
export type RoomStatus = ClassroomSummary["roomStatus"];
