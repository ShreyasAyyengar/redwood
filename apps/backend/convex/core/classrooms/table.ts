import { defineTable } from "convex/server";
import { zodOutputToConvex } from "convex-helpers/server/zod";
import { classroomSchema } from "./schemas.ts";

export const classroomTable = defineTable(zodOutputToConvex(classroomSchema))
  .index("byIsActive", ["isActive"])
  .index("byGroupKey", ["groupKey"])
  .index("byAttributes", ["attributes"]);
