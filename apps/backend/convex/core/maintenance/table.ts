import { defineTable } from "convex/server";
import { zodOutputToConvex } from "convex-helpers/server/zod";
import { maintenanceEntrySchema } from "./schemas.ts";

export const maintenanceEntryTable = defineTable(zodOutputToConvex(maintenanceEntrySchema)).index("byClassroomIdAndDate", [
  "classroomId",
  "date",
]);
