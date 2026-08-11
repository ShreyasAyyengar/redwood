import { defineTable } from "convex/server";
import { zodOutputToConvex } from "convex-helpers/server/zod";
import { taskSchema, taskTemplateSchema } from "./schemas.ts";

export const taskTable = defineTable(zodOutputToConvex(taskSchema))
  .index("byFeed", ["feedStatus", "feedDate"])
  .index("byClassroomIdAndFeed", ["classroomId", "feedStatus", "feedDate"]);

export const taskTemplateTable = defineTable(zodOutputToConvex(taskTemplateSchema)).index("byName", ["name"]);
