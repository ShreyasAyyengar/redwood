import { defineTable } from "convex/server";
import { zodOutputToConvex } from "convex-helpers/server/zod";
import { maintenanceTemplateSchema, maintenanceTemplateVersionSchema } from "./definitions.ts";
import { maintenanceEntrySchema } from "./schemas.ts";

export const maintenanceTemplateTable = defineTable(zodOutputToConvex(maintenanceTemplateSchema)).index("byKey", ["key"]);
export const maintenanceTemplateVersionTable = defineTable(zodOutputToConvex(maintenanceTemplateVersionSchema));

export const maintenanceEntryTable = defineTable(zodOutputToConvex(maintenanceEntrySchema)).index("byClassroomIdAndDate", [
  "classroomId",
  "date",
]);
