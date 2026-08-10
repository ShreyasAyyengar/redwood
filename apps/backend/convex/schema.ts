import { attributeSchema, classroomSchema, groupSchema, issueSchema, maintenanceEntrySchema, taskSchema } from "@redwood/contracts";
import { defineSchema, defineTable } from "convex/server";
import { zodOutputToConvex } from "convex-helpers/server/zod";

export default defineSchema({
  issues: defineTable(zodOutputToConvex(issueSchema)),
  tasks: defineTable(zodOutputToConvex(taskSchema)),
  classrooms: defineTable(zodOutputToConvex(classroomSchema)),
  attributes: defineTable(zodOutputToConvex(attributeSchema)),
  groups: defineTable(zodOutputToConvex(groupSchema)),
  maintenance: defineTable(zodOutputToConvex(maintenanceEntrySchema)),
});
