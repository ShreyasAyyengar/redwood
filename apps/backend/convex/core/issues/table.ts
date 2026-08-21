import { defineTable } from "convex/server";
import { zodOutputToConvex } from "convex-helpers/server/zod";
import { issueSchema } from "./schemas.ts";

export const issueTable = defineTable(zodOutputToConvex(issueSchema))
  .index("byFeed", ["feedStatus", "feedDate"])
  .index("byClassroomIdAndFeed", ["classroomId", "feedStatus", "feedDate"])
  .index("byClassroomIdAndResolution", ["classroomId", "resolution"]);
